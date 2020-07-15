import RequestType from './types';
import Request from './request';

export default class RPCResponseRequest extends Request {
  result: string;
  responseNonce: Uint8Array;

  constructor(
    identifier: string,
    publicKey: string,
    encryptedKey: string,
    responseNonce: Uint8Array,
    result: string = ''
  ) {
    super(RequestType.RPCRESPONSE, identifier, publicKey, encryptedKey);
    this.result = result;
    this.responseNonce = responseNonce;
  }

  static fromPacket(packet: any): RPCResponseRequest {
    return new RPCResponseRequest(
      packet.i.toString(),
      packet.pk.toString(),
      packet.ek.toString(),
      packet.rn,
      packet.rr.toString()
    );
  }

  toObject(): object {
    const parentObject = super.toObject();
    return {
      ...parentObject,
      rr: this.result,
      rn: this.responseNonce,
    };
  }
}
