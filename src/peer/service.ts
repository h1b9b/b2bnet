import EventEmitter from 'events';
import Peer from './peer';

export default class PeerService extends EventEmitter {
  peers: { [key: string]: Peer } = {}; // list of peers seen recently: address -> pk, ek, timestamp;
  timeout: number;

  constructor(timeout: number) {
    super();
    this.timeout = timeout;
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

  get(address: string): Peer | null {
    return this.peers[address] || null;
  }

  private add(address: string, peer: Peer) {
    this.peers[address] = peer;
    this.emit('seen', address);
  }

  sawPeer(address: string, publicKey: string, encryptedKey?: string) {
    const peer = this.peers[address];

    if (!peer || peer.timedOut(this.timeout) === false) {
      const newPeer = new Peer(publicKey, Date.now(), encryptedKey);
      this.add(address, newPeer);
    } else {
      peer.update(Date.now(), encryptedKey);
    }
  }
}
