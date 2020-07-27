import nacl, { BoxKeyPair } from 'tweetnacl';
import bencode from 'bencode';
import bs58 from 'bs58';

export default class EncryptionService {
  keyPairEncrypt: BoxKeyPair;

  constructor(keyPairEncrypt: BoxKeyPair) {
    this.keyPairEncrypt = keyPairEncrypt;
  }

  encrypt(packet: Uint8Array, to: string): Uint8Array {
    const nonce = nacl.randomBytes(nacl.box.nonceLength);

    return bencode.encode({
      n: nonce,
      ek: bs58.encode(Buffer.from(this.keyPairEncrypt.publicKey)),
      e: nacl.box(
        packet,
        nonce,
        bs58.decode(to),
        this.keyPairEncrypt.secretKey
      ),
    });
  }

  decrypt(message: Buffer): Uint8Array | null {
    if (this.keyPairEncrypt.secretKey == null) {
      throw new Error('No encryption key.');
    }
    const { ek, n, e } = bencode.decode(message);

    return nacl.box.open(
      e,
      n,
      bs58.decode(ek.toString()),
      this.keyPairEncrypt.secretKey
    );
  }

  isEncrypted(message: Buffer): boolean {
    const unpacked = bencode.decode(message);

    return unpacked.e != null && unpacked.n != null && unpacked.ek != null;
  }
}
