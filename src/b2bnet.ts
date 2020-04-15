import bs58 from 'bs58';
import bs58check from 'bs58check-ts';
import nacl from 'tweetnacl';
import ripemd160 from 'ripemd160';
import debug from 'debug';
import { EventEmitter } from 'events';
import buildExtention from './webtorrent/extension';
import MessageService from './message/service';
import Package from './packages/entities/abstract';
import PackageHandler from './packages/handler';
import PackageService from './packages/service';
import PacketType from './packages/types';
import PeerService from './peer/service';
import RpcService, { RpcApiFunction } from './rpc/service';
import WebTorrentService, { WebTorrentOptions } from './webtorrent/service';

const PEERTIMEOUT = 5 * 60 * 1000;
const SEEDPREFIX = '490a';
const ADDRESSPREFIX = '55';
const log = debug('B2BNet');

interface B2BNetOptionsInterface extends WebTorrentOptions {
  seed?: string;
  timeout?: number;
  heartbeat?: number;
  keyPair?: nacl.SignKeyPair;
}

export default class B2BNet extends EventEmitter {
  keyPair: nacl.SignKeyPair;
  publicKey: string;
  encryptedKey: string;
  identifier: string;
  timeout: number;
  serveraddress?: string = undefined;
  heartbeattimer?: any = null;
  packageService: PackageService;
  packageHandler: PackageHandler;
  webTorrentService: WebTorrentService;
  rpcService: RpcService;
  peerService: PeerService;
  messageService: MessageService;

  constructor(
    identifier: any = null,
    {
      seed,
      timeout,
      heartbeat,
      keyPair,
      ...options
    }: B2BNetOptionsInterface = {}
  ) {
    super();
    seed = seed || this.encodeseed(nacl.randomBytes(32));
    this.timeout = timeout || PEERTIMEOUT;

    this.keyPair =
      keyPair ||
      nacl.sign.keyPair.fromSeed(
        Uint8Array.from(bs58check.decode(seed)).slice(2)
      );
    // ephemeral encryption key only used for this session
    const keyPairEncrypt = nacl.box.keyPair();
    this.publicKey = bs58.encode(Buffer.from(this.keyPair.publicKey));
    this.encryptedKey = bs58.encode(Buffer.from(keyPairEncrypt.publicKey));
    this.identifier = identifier || this.address();

    log('address', this.address());
    log('identifier', this.identifier);
    log('public key', this.publicKey);
    log('encryption key', this.encryptedKey);

    if (heartbeat) {
      this.heartbeattimer = setInterval(this.heartbeat.bind(this), heartbeat);
    }

    this.webTorrentService = new WebTorrentService(
      this.identifier,
      [buildExtention(this)],
      options
    );
    this.packageHandler = new PackageHandler(this);
    this.packageService = new PackageService(
      this.identifier,
      this.publicKey,
      this.encryptedKey,
      this.timeout,
      keyPairEncrypt,
      this.keyPair.secretKey
    );
    this.rpcService = new RpcService(this.packageService);
    this.peerService = new PeerService(this.timeout);
    this.messageService = new MessageService();

    this.peerService.on('seen', (address: string) => {
      this.ping();
      this.emit('seen', address);
      if (address === this.identifier) {
        this.serveraddress = address;
        this.emit('server', address);
      }
    });
    this.webTorrentService.on('connections', (peersCount) => {
      this.emit('connections', peersCount);
    });
  }

  private encodeseed(material: ArrayBuffer | SharedArrayBuffer): string {
    return bs58check.encode(
      Buffer.concat([Buffer.from(SEEDPREFIX, 'hex'), Buffer.from(material)])
    );
  }

  private heartbeat() {
    this.ping();
    this.peerService.removeTimeoutPeers();
  }

  private ping() {
    const pingPackage = this.packageService.build({ type: PacketType.PING });
    this.sendPackage(pingPackage);
  }

  sendPackage(packet: Package, publicKey?: string) {
    let peerEncryptKey;
    if (publicKey != null) {
      const peerAddress = this.address(publicKey);
      const peer = this.peerService.get(peerAddress);
      if (peer) {
        peerEncryptKey = peer.encryptedKey;
        if (peerEncryptKey == null) {
          throw new Error(`No encryption key for ${peerAddress}.`);
        }
      } else {
        throw new Error(`${peerAddress} not seen.`);
      }
    }

    const message = this.packageService.encode(packet, peerEncryptKey);
    this.webTorrentService.send(message);
  }

  address(publicKey: string | Uint8Array = this.keyPair.publicKey): string {
    let arrayKey: Uint8Array;

    if (typeof publicKey === 'string') {
      arrayKey = bs58.decode(publicKey);
    } else {
      arrayKey = publicKey;
    }

    return bs58check.encode(
      Buffer.concat([
        Buffer.from(ADDRESSPREFIX, 'hex'),
        new ripemd160().update(Buffer.from(nacl.hash(arrayKey))).digest(),
      ])
    );
  }

  emit(event: string, ...args: any[]): boolean {
    log(event, ...args);
    return super.emit(event, ...args);
  }

  private isSame(address: string): boolean {
    return address === this.address();
  }

  sawPeer(publicKey: string, encryptedKey?: string) {
    const address = this.address(publicKey);

    if (this.isSame(address) === false) {
      this.peerService.sawPeer(address, publicKey, encryptedKey);
    }
  }

  register(name: string, func: RpcApiFunction) {
    this.rpcService.registerApi(name, func);
  }

  rpc(address: string, call: string, args: any, callback?: CallableFunction) {
    const peer = this.peerService.get(address);
    if (peer) {
      const { publicKey } = peer;
      const nonce = this.rpcService.registerCallBack(callback);
      const rpcPackage = this.rpcService.buildCallPackage(call, nonce, args);
      this.sendPackage(rpcPackage, publicKey);
    } else {
      throw new Error(`${address} not seen - no public key.`);
    }
  }

  send(address: string, message: any) {
    const peer = this.peerService.get(address);
    if (!peer) {
      throw new Error(`${address} not seen.`);
    }

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

  handle(packet: Package) {
    this.packageHandler.exec(packet);
  }

  destroy(callback?: (err: string | Error) => void) {
    clearInterval(this.heartbeattimer);
    const disconnectPackage = this.packageService.build({
      type: PacketType.DISCONNECT,
    });
    this.sendPackage(disconnectPackage);
    this.webTorrentService.destroy(callback);
  }

  close = this.destroy;

  handshake() {
    const peersCount = this.webTorrentService.connections();
    this.emit('wireseen', peersCount);
  }
}
