import nacl, { BoxKeyPair } from 'tweetnacl';
import bencode from 'bencode';
import Package from './entities/abstract';
import PackageFactory from './factory';
import EncryptPackage from './encrypt';

export default class PackageService {
  identifier: string;
  publicKey: string;
  encryptedKey: string;
  timeout: number;
  secretKey: Uint8Array;
  packageFactory: PackageFactory;
  encryptPackage: EncryptPackage;

  constructor(
    identifier: string,
    publicKey: string,
    encryptedKey: string,
    timeout: number,
    keyPairEncrypt: BoxKeyPair,
    secretKey: Uint8Array
  ) {
    this.identifier = identifier;
    this.publicKey = publicKey;
    this.encryptedKey = encryptedKey;
    this.timeout = timeout;
    this.secretKey = secretKey;
    this.packageFactory = new PackageFactory();
    this.encryptPackage = new EncryptPackage(keyPairEncrypt);
  }

  private encodeAndSignPackage(object: Package): Uint8Array {
    const encodedPacket = bencode.encode(object.toObject());
    return bencode.encode({
      s: nacl.sign.detached(encodedPacket, this.secretKey),
      p: encodedPacket,
    });
  }

  encode(object: Package, to?: string): Uint8Array {
    const encodedPacket = this.encodeAndSignPackage(object);

    if (to != null) {
      return this.encryptPackage.encrypt(encodedPacket, to);
    }

    return encodedPacket;
  }

  private decodePacket(message: Buffer): Uint8Array {
    const unpacked = bencode.decode(message);
    return bencode.decode(unpacked.p);
  }

  private extractPacket(message: Buffer): Uint8Array | null {
    if (this.encryptPackage.isEncrypted(message)) {
      const decryptedMessage = this.encryptPackage.decrypt(message);
      if (decryptedMessage) {
        return this.decodePacket(Buffer.from(decryptedMessage));
      }
      return null;
    }

    return this.decodePacket(message);
  }

  decode(message: Buffer): Package | null {
    const unpackedMessage = this.extractPacket(message);
    if (unpackedMessage != null) {
      const decodedPackage = this.packageFactory.parse(unpackedMessage);
      if (decodedPackage.isValid(this.identifier, this.timeout)) {
        return decodedPackage;
      }
    }

    return null;
  }

  build(options: {}): Package {
    return this.packageFactory.build({
      identifier: this.identifier,
      publicKey: this.publicKey,
      encryptedKey: this.encryptedKey,
      ...options,
    });
  }
}
