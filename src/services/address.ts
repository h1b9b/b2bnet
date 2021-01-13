import bs58 from 'bs58';
import bs58safe from 'bs58check-ts';
import nacl from 'tweetnacl';
import ripemd160 from 'ripemd160';

const ADDRESSPREFIX = '55';

export default class AddressService {
  private generateAddress(publicKey: Uint8Array): string {
    return bs58safe.encode(
      Buffer.concat([
        Buffer.from(ADDRESSPREFIX, 'hex'),
        new ripemd160().update(Buffer.from(nacl.hash(publicKey))).digest(),
      ])
    );
  }

  get(publicKey: string | Uint8Array): string {
    if (typeof publicKey === 'string') {
      return this.generateAddress(bs58.decode(publicKey));
    }

    return this.generateAddress(publicKey);
  }
}
