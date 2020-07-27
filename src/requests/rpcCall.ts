import RequestType from './types';
import Request from './request';

export default class RPCCallRequest extends Request {
  call: string;
  args: string;
  responseNonce: Uint8Array;

  constructor(
    identifier: string,
    publicKey: string,
    encryptedKey: string,
    call: string,
    args: string,
    responseNonce: Uint8Array
  ) {
    super(RequestType.RPCCALL, identifier, publicKey, encryptedKey);
    this.call = call;
    this.args = args;
    this.responseNonce = responseNonce;
  }

  static fromPacket(packet: any): RPCCallRequest {
    return new RPCCallRequest(
      packet.i.toString(),
      packet.pk.toString(),
      packet.ek.toString(),
      packet.c.toString(),
      packet.a.toString(),
      packet.rn
    );
  }

  toObject(): object {
    const parentObject = super.toObject();
    return {
      ...parentObject,
      c: this.call,
      a: this.args,
      rn: this.responseNonce,
    };
  }
}
