import nacl from 'tweetnacl';
import bencode from 'bencode';
import EncryptionService from './encryption';
import WalletService from './wallet';
import Request from '../requests/request';

export default class EncodingService {
  private walletService: WalletService;
  private encryptionService: EncryptionService;

  constructor(walletService: WalletService) {
    this.walletService = walletService;
    this.encryptionService = new EncryptionService(
      walletService.keyPairEncrypt
    );
  }

  private encodeAndSignPackage(object: Request): Uint8Array {
    const encodedPacket = bencode.encode(object.toObject());
    return bencode.encode({
      s: nacl.sign.detached(encodedPacket, this.walletService.secretKey),
      p: encodedPacket,
    });
  }

  encode(object: Request, to?: string): Uint8Array {
    const encodedPacket = this.encodeAndSignPackage(object);

    if (to != null) {
      return this.encryptionService.encrypt(encodedPacket, to);
    }

    return encodedPacket;
  }

  private decodePacket(message: Buffer): Uint8Array {
    const unpacked = bencode.decode(message);
    return bencode.decode(unpacked.p);
  }

  decode(message: Buffer): Uint8Array | null {
    if (this.encryptionService.isEncrypted(message)) {
      const decryptedMessage = this.encryptionService.decrypt(message);
      if (decryptedMessage) {
        return this.decodePacket(Buffer.from(decryptedMessage));
      }
      return null;
    }

    return this.decodePacket(message);
  }
}
