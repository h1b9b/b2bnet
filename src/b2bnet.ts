import { SignKeyPair } from 'tweetnacl';
import debug from 'debug';
import Package from './packages/entities/abstract';
import PackageService from './services/package';
import PacketType from './packages/types';
import PeerService from './services/peer';
import RpcService, { RpcApiFunction } from './services/rpc';
import WebTorrentService, { WebTorrentOptions } from './services/torrent';
import AddressService from './services/address';
import WalletService from './services/wallet';
import EventService from './services/events';
import { WireExtensionBuilder } from './services/extensionBuilder';

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
  private packageService: PackageService;
  private webTorrentService: WebTorrentService;
  private rpcService: RpcService;
  private peerService: PeerService;
  private addressService: AddressService;
  private eventService: EventService;

  constructor(
    identifier: any = null,
    { seed, timeout, keyPair, ...options }: B2BNetOptionsInterface = {}
  ) {
    this.rpcService = new RpcService();
    this.addressService = new AddressService();
    this.walletService = new WalletService(identifier, seed, keyPair);
    this.eventService = new EventService(this.walletService);
    this.peerService = new PeerService(
      this.eventService,
      this.walletService,
      timeout
    );

    this.address = this.walletService.address;
    this.identifier = this.walletService.identifier;
    this.packageService = new PackageService(
      this.walletService,
      this.peerService,
      this.rpcService
    );

    log('address', this.address);
    log('identifier', this.identifier);
    log('public key', this.walletService.publicKey);
    log('encryption key', this.walletService.encryptedKey);

    const wireExtensionBuilder = new WireExtensionBuilder(
      this.walletService,
      this.packageService,
      this.peerService,
      this.eventService
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
  }

  private ping() {
    const pingPackage = this.packageService.build({ type: PacketType.PING });
    this.sendPackage(pingPackage);
  }

  sendPackage(packet: Package, publicKey?: string) {
    let peerEncryptKey;
    if (publicKey != null) {
      const peerAddress = this.addressService.get(publicKey);
      peerEncryptKey = this.peerService.getEncryptedKey(peerAddress);
    }

    const message = this.packageService.encode(packet, peerEncryptKey);
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
    const rpcPackage = this.packageService.build({
      call,
      responseNonce,
      args: JSON.stringify(args),
      type: PacketType.RPCCALL,
    });
    this.sendPackage(rpcPackage, publicKey);
  }

  send(address: string, message: any) {
    this.peerService.get(address);

    const messagePackage = this.packageService.build({
      message: JSON.stringify(message),
      type: PacketType.MESSAGE,
    });
    this.sendPackage(messagePackage);
    this.emit('sent', address, message);
  }

  broadcast(message: any) {
    const messagePackage = this.packageService.build({
      message: JSON.stringify(message),
      type: PacketType.MESSAGE,
    });
    this.sendPackage(messagePackage);
    this.emit('broadcast', message);
  }

  destroy(callback?: (err: string | Error) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const disconnectPackage = this.packageService.build({
        type: PacketType.DISCONNECT,
      });
      this.sendPackage(disconnectPackage);
      this.webTorrentService.destroy((error: string | Error) => {
        if (error != null) {
          reject(error)
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
      return await this.webTorrentService.addPeer(
        b2bnet.getPublicAddress()
      );
    } catch (e) {
      return false;
    }
  }
}
