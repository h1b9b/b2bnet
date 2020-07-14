import nacl from 'tweetnacl';
import bencode from 'bencode';
import Package from '../packages/entities/abstract';
import PackageFactory from '../packages/factory';
import EncryptionService from './encryption';
import PeerService from './peer';
import WalletService from './wallet';
import B2BNet from '../b2bnet';
import PackageHandler from '../packages/handler';

export default class PackageService {
  walletService: WalletService;
  peerService: PeerService;
  packageFactory: PackageFactory;
  encryptionService: EncryptionService;

  constructor(
    walletService: WalletService,
    peerService: PeerService
  ) {
    this.peerService = peerService;
    this.walletService = walletService;
    this.encryptionService = new EncryptionService(walletService.keyPairEncrypt);
    this.packageFactory = new PackageFactory();
  }

  private encodeAndSignPackage(object: Package): Uint8Array {
    const encodedPacket = bencode.encode(object.toObject());
    return bencode.encode({
      s: nacl.sign.detached(encodedPacket, this.walletService.secretKey),
      p: encodedPacket,
    });
  }

  encode(object: Package, to?: string): Uint8Array {
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

  private extractPacket(message: Buffer): Uint8Array | null {
    if (this.encryptionService.isEncrypted(message)) {
      const decryptedMessage = this.encryptionService.decrypt(message);
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
      if (decodedPackage.isValid(this.walletService.identifier, this.peerService.timeout)) {
        return decodedPackage;
      }
    }

    return null;
  }

  build(options: {}): Package {
    return this.packageFactory.build({
      identifier: this.walletService.identifier,
      publicKey: this.walletService.publicKey,
      encryptedKey: this.walletService.encryptedKey,
      ...options,
    });
  }

  handle(b2bnet: B2BNet, packet: Package) {
    PackageHandler.exec(b2bnet, packet);
  }
}
