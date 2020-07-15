import B2BNet from '../b2bnet';
import Package from './entities/abstract';
import PacketType from './types';
import AbstractHandler from './handlers/abstract';
import MessageHandler from './handlers/message';
import PingHandler from './handlers/ping';
import DisconectHandler from './handlers/disconnect';
import PeerService from '../services/peer';
import RpcService from '../services/rpc';
import RPCCallHandler from './handlers/rpcCall';
import RPCResponseHandler from './handlers/rpcResponse';
import PackageService from '../services/package';

export default class PackageHandler {
  rpcService: RpcService;
  peerService: PeerService;
  packageService: PackageService;
  handlers: { [key: string]: AbstractHandler<Package>} = {};

  constructor(rpcService: RpcService, peerService: PeerService, packageService: PackageService) {
    this.rpcService = rpcService;
    this.peerService = peerService;
    this.packageService = packageService;
    this.registerHandlers();
  }

  private registerHandlers() {
    this.handlers[PacketType.PING] = new PingHandler();
    this.handlers[PacketType.DISCONNECT] = new DisconectHandler(this.peerService);
    this.handlers[PacketType.MESSAGE] = new MessageHandler();
    this.handlers[PacketType.RPCCALL] = new RPCCallHandler(this.rpcService, this.packageService);
    this.handlers[PacketType.RPCRESPONSE] = new RPCResponseHandler(this.rpcService);
  }

  public handle(b2bnet: B2BNet, packet: Package) {
    const handler = this.handlers[packet.type];
    if (handler != null) {
      handler.handle(b2bnet, packet);
    }
  }
}
