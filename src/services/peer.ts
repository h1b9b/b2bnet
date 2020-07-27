import Peer from '../models/peer';
import EventService from './events';
import WalletService from './wallet';

const PEERTIMEOUT = 5 * 60 * 1000;

export default class PeerService {
  peers: { [key: string]: Peer } = {}; // list of peers seen recently: address -> pk, ek, timestamp;
  timeout: number;
  eventService: EventService;
  walletService: WalletService;

  constructor(
    eventService: EventService,
    walletService: WalletService,
    timeout?: number
  ) {
    this.timeout = timeout || PEERTIMEOUT;
    this.eventService = eventService;
    this.walletService = walletService;
  }

  removeTimeoutPeers() {
    for (const address in this.peers) {
      if (this.peers.hasOwnProperty(address)) {
        const peer = this.peers[address];
        if (peer.timedOut(this.timeout)) {
          this.removePeer(address);
          this.emit('timeout', address);
        }
      }
    }
  }

  removePeer(address: string) {
    delete this.peers[address];
    this.emit('left', address);
  }

  get(address: string): Peer {
    const peer = this.peers[address];
    if (peer != null) {
      return peer;
    }

    throw new Error(`${address} not seen.`);
  }

  getEncryptedKey(address: string) {
    const peer = this.get(address);
    if (peer) {
      if (peer.encryptedKey != null) {
        return peer.encryptedKey;
      }
      throw new Error(`No encryption key for ${address}.`);
    }
    throw new Error(`${address} not seen.`);
  }

  private isPeer(address: string): boolean {
    return address !== this.walletService.address;
  }

  sawPeer(address: string, publicKey: string, encryptedKey?: string) {
    if (this.isPeer(address)) {
      const peer = this.peers[address];

      if (!peer || peer.timedOut(this.timeout) === false) {
        const newPeer = new Peer(publicKey, Date.now(), encryptedKey);
        this.peers[address] = newPeer;
        this.emit('seen', address);
      } else {
        peer.update(Date.now(), encryptedKey);
        this.emit('updated', address);
      }
    }
  }

  emit(event: string, ...args: any[]): boolean {
    return this.eventService.emit('peer', event, ...args);
  }

  on(event: string, listener: (...args: any[]) => void) {
    this.eventService.on('peer', event, listener);
  }
}
