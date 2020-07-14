import bs58 from 'bs58';
import bs58check from 'bs58check-ts';
import nacl, { SignKeyPair, BoxKeyPair } from 'tweetnacl';
import AddressService from './address';

const SEEDPREFIX = '490a';

export default class WalletService {
  publicKey: string;
  encryptedKey: string;
  secretKey: Uint8Array;
  keyPair: SignKeyPair;
  keyPairEncrypt: BoxKeyPair;
  identifier: string;
  address: string;

  constructor(identifier?: string, seed?: string, keyPair?: SignKeyPair) {
    seed = seed || this.encodeseed(nacl.randomBytes(32));
    this.keyPair =
      keyPair ||
      nacl.sign.keyPair.fromSeed(
        Uint8Array.from(bs58check.decode(seed)).slice(2)
      );
    // ephemeral encryption key only used for this session
    this.keyPairEncrypt = nacl.box.keyPair();
    this.publicKey = bs58.encode(Buffer.from(this.keyPair.publicKey));
    this.encryptedKey = bs58.encode(Buffer.from(this.keyPairEncrypt.publicKey));
    this.secretKey = this.keyPair.secretKey;
    const addressService = new AddressService();
    this.address = addressService.get(this.publicKey);
    this.identifier = identifier || this.address;
  }
  
  private encodeseed(material: ArrayBuffer | SharedArrayBuffer): string {
    return bs58check.encode(
      Buffer.concat([Buffer.from(SEEDPREFIX, 'hex'), Buffer.from(material)])
    );
  }
}