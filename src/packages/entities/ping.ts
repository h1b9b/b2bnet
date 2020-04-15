import Package from './abstract';
import PacketType from '../types';

export default class PingPackage extends Package {
  constructor(identifier: string, publicKey: string, encryptedKey: string) {
    super(PacketType.PING, identifier, publicKey, encryptedKey);
  }

  static fromPacket(packet: any): PingPackage {
    return new PingPackage(
      packet.i.toString(),
      packet.pk.toString(),
      packet.ek.toString()
    );
  }
}
