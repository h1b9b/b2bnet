import RequestType from './types';
import Request from './request';

export default class DisconnectRequest extends Request {
  constructor(identifier: string, publicKey: string, encryptedKey: string) {
    super(RequestType.DISCONNECT, identifier, publicKey, encryptedKey);
  }

  static fromPacket(packet: any): DisconnectRequest {
    return new DisconnectRequest(
      packet.i.toString(),
      packet.pk.toString(),
      packet.ek.toString()
    );
  }
}
