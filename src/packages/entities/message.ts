import Package from './abstract';
import PacketType from '../types';

export default class MessagePackage extends Package {
  message: string;

  constructor(
    identifier: string,
    publicKey: string,
    encryptedKey: string,
    message: string = ''
  ) {
    super(PacketType.MESSAGE, identifier, publicKey, encryptedKey);
    this.message = message;
  }

  static fromPacket(packet: any): MessagePackage {
    return new MessagePackage(
      packet.i.toString(),
      packet.pk.toString(),
      packet.ek.toString(),
      packet.v.toString()
    );
  }

  toObject(): object {
    const parentObject = super.toObject();
    return {
      ...parentObject,
      v: this.message,
    };
  }
}
