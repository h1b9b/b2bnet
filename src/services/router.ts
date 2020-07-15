import RequestType from '../requests/types';
import Request from '../requests/request';
import RpcService from './rpc';
import PeerService from './peer';
import PackageService from './encoding';
import BaseController from '../controllers/base';
import PingController from '../controllers/ping';
import MessageController from '../controllers/message';
import DisconectController from '../controllers/disconnect';
import RPCCallController from '../controllers/rpccall';
import RPCResponseController from '../controllers/rpcResponse';
import B2BNet from '../b2bnet';
import AddressService from './address';
import RequestParser from './requestParser';
import WalletService from './wallet';
import EncodingService from './encoding';
import RequestBuilder from './requestBuilder';

export default class Router {
  private routes: { [key: string]: BaseController<Request> } = {};
  private rpcService: RpcService;
  private peerService: PeerService;
  private addressService: AddressService;
  private encodingService: PackageService;
  private walletService: WalletService;
  private requestParser: RequestParser;
  private requestBuilder: RequestBuilder;

  constructor(
    rpcService: RpcService,
    peerService: PeerService,
    walletService: WalletService
  ) {
    this.addressService = new AddressService();
    this.requestParser = new RequestParser();
    this.rpcService = rpcService;
    this.peerService = peerService;
    this.walletService = walletService;
    this.encodingService = new EncodingService(this.walletService);
    this.requestBuilder = new RequestBuilder(this.walletService);
    this.registerControllers();
  }

  private registerControllers() {
    this.routes[RequestType.PING] = new PingController();
    this.routes[RequestType.DISCONNECT] = new DisconectController(
      this.peerService
    );
    this.routes[RequestType.MESSAGE] = new MessageController();
    this.routes[RequestType.RPCCALL] = new RPCCallController(
      this.rpcService,
      this.requestBuilder
    );
    this.routes[RequestType.RPCRESPONSE] = new RPCResponseController(
      this.rpcService
    );
  }

  public dispatch(application: B2BNet, buffer: Buffer) {
    const message = this.encodingService.decode(buffer);
    if (message != null) {
      const request = this.requestParser.parse(message);
      if (
        request != null &&
        request.isValid(this.walletService.identifier, this.peerService.timeout)
      ) {
        const address = this.addressService.get(request.publicKey);
        this.peerService.sawPeer(
          address,
          request.publicKey,
          request.encryptedKey
        );
        const controller = this.routes[request.type];
        if (controller != null) {
          controller.call(application, request);
        }
      }
    }
  }
}
