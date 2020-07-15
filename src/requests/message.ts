import RequestType from './types';
import Request from './request';

export default class MessageRequest extends Request {
  message: string;

  constructor(
    identifier: string,
    publicKey: string,
    encryptedKey: string,
    message: string = ''
  ) {
    super(RequestType.MESSAGE, identifier, publicKey, encryptedKey);
    this.message = message;
  }

  static fromPacket(packet: any): MessageRequest {
    return new MessageRequest(
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
