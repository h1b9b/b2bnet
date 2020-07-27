import nacl from 'tweetnacl';
import { toHex } from '../util';

export default class MessageService {
  seen: { [key: string]: number } = {}; // messages we've seen recently: hash -> timestamp

  isNew(messageHash: string): boolean {
    return this.seen[messageHash] == null;
  }

  refresh(messageHash: string): void {
    this.seen[messageHash] = Date.now();
  }

  hash(message: Buffer): string {
    return toHex(nacl.hash(message).slice(16));
  }
}
