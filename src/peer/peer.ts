export default class Peer {
  publicKey: string;
  timestamp: number;
  encryptedKey?: string;

  constructor(
    publicKey: string,
    timestamp: number = Date.now(),
    encryptedKey?: string
  ) {
    this.publicKey = publicKey;
    this.timestamp = timestamp;
    this.encryptedKey = encryptedKey;
  }

  timedOut(timeout: number, timestamp: number = Date.now()): boolean {
    return this.timestamp + timeout >= timestamp;
  }

  update(timestamp: number = Date.now(), encryptedKey?: string) {
    this.timestamp = timestamp;
    this.encryptedKey = encryptedKey;
  }
}
