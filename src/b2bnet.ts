import { SignKeyPair } from 'tweetnacl';
import debug from 'debug';
import EncodingService from './services/encoding';
import RequestType from './requests/types';
import PeerService from './services/peer';
import RpcService, { RpcApiFunction } from './services/rpc';
import WebTorrentService, { WebTorrentOptions } from './services/torrent';
import AddressService from './services/address';
import WalletService from './services/wallet';
import EventService from './services/events';
import { WireExtensionBuilder } from './services/extensionBuilder';
import Router from './services/router';
import RequestBuilder from './services/requestBuilder';
import Request from './requests/request';

const log = debug('B2BNet');

interface B2BNetOptionsInterface extends WebTorrentOptions {
  seed?: string;
  timeout?: number;
  keyPair?: SignKeyPair;
}

export default class B2BNet {
  address: string;
  identifier: string;
  serveraddress?: string = undefined;
  public Ready: Promise<any>;

  private walletService: WalletService;
  private encodingService: EncodingService;
  private webTorrentService: WebTorrentService;
  private rpcService: RpcService;
  private peerService: PeerService;
  private addressService: AddressService;
  private eventService: EventService;
  private router: Router;
  private requestBuilder: RequestBuilder;

  constructor(
    identifier: any = null,
    { seed, timeout, keyPair, ...options }: B2BNetOptionsInterface = {}
  ) {
    this.rpcService = new RpcService();
    this.addressService = new AddressService();
    this.walletService = new WalletService(identifier, seed, keyPair);
    this.eventService = new EventService(this.walletService);
    this.requestBuilder = new RequestBuilder(this.walletService);
    this.encodingService = new EncodingService(this.walletService);
    this.peerService = new PeerService(
      this.eventService,
      this.walletService,
      timeout
    );
    this.router = new Router(
      this.rpcService,
      this.peerService,
      this.walletService
    );

    this.address = this.walletService.address;
    this.identifier = this.walletService.identifier;

    const wireExtensionBuilder = new WireExtensionBuilder(
      this.walletService,
      this.peerService,
      this.router
    );

    this.webTorrentService = new WebTorrentService(
      { ...options, extensions: [wireExtensionBuilder.get(this)] },
      this.walletService,
      this.eventService
    );

    this.eventService.on('webtorrent', 'connections', (peersCount) =>
      this.emit('connections', peersCount)
    );
    this.eventService.on('peer', 'seen', this.onPeerSeen);

    this.Ready = this.webTorrentService.Ready;
  }

  private isServer(address: string): boolean {
    return address === this.identifier;
  }

  private onPeerSeen = (address: string) => {
    this.ping();
    this.emit('seen', address);
    // console.log(this.identifier, 'saw', address);
    if (this.isServer(address)) {
      this.serveraddress = address;
      this.emit('server', address);
    }
  };

  private ping() {
    const pingPackage = this.requestBuilder.build({ type: RequestType.PING });
    this.sendPackage(pingPackage);
  }

  sendPackage(request: Request, publicKey?: string) {
    let peerEncryptKey;
    if (publicKey != null) {
      const peerAddress = this.addressService.get(publicKey);
      peerEncryptKey = this.peerService.getEncryptedKey(peerAddress);
    }

    const message = this.encodingService.encode(request, peerEncryptKey);
    this.webTorrentService.send(message);
  }

  emit(event: string, ...args: any[]): boolean {
    return this.eventService.emit('b2bnet', event, ...args);
  }

  on(event: string, listener: (...args: any[]) => void) {
    this.eventService.on('b2bnet', event, listener);
  }

  register(name: string, func: RpcApiFunction) {
    this.rpcService.registerApi(name, func);
  }

  rpc(address: string, call: string, args: any, callback?: CallableFunction) {
    const peer = this.peerService.get(address);
    const { publicKey } = peer;
    const responseNonce = this.rpcService.registerCallBack(callback);
    const rpcPackage = this.requestBuilder.build({
      call,
      responseNonce,
      args: JSON.stringify(args),
      type: RequestType.RPCCALL,
    });
    this.sendPackage(rpcPackage, publicKey);
  }

  send(address: string, message: any) {
    this.peerService.get(address);

    const messagePackage = this.requestBuilder.build({
      message: JSON.stringify(message),
      type: RequestType.MESSAGE,
    });
    this.sendPackage(messagePackage);
    this.emit('sent', address, message);
  }

  broadcast(message: any) {
    const messagePackage = this.requestBuilder.build({
      message: JSON.stringify(message),
      type: RequestType.MESSAGE,
    });
    this.sendPackage(messagePackage);
    this.emit('broadcast', message);
  }

  destroy(callback?: (err: string | Error) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const disconnectPackage = this.requestBuilder.build({
        type: RequestType.DISCONNECT,
      });
      this.sendPackage(disconnectPackage);
      this.webTorrentService.destroy((error: string | Error) => {
        if (error != null) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  close = this.destroy;

  getPublicAddress(): string {
    return this.webTorrentService.getAddress();
  }

  async addPeer(b2bnet: B2BNet): Promise<boolean> {
    try {
      return await this.webTorrentService.addPeer(b2bnet.getPublicAddress());
    } catch (e) {
      return false;
    }
  }
}
