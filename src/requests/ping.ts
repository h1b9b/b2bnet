import RequestType from './types';
import Request from './request';

export default class PingRequest extends Request {
  constructor(identifier: string, publicKey: string, encryptedKey: string) {
    super(RequestType.PING, identifier, publicKey, encryptedKey);
  }

  static fromPacket(packet: any): PingRequest {
    return new PingRequest(
      packet.i.toString(),
      packet.pk.toString(),
      packet.ek.toString()
    );
  }
}
