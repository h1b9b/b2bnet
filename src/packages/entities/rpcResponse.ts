import Package from "./abstract";
import PacketType from "../types";

export default class RpcResponsePackage extends Package {
  result: string;
  responseNonce: Uint8Array;

  constructor(
    identifier: string,
    publicKey: string,
    encryptedKey: string,
    responseNonce: Uint8Array,
    result: string = '',
  ) {
    super(PacketType.RPCRESPONSE, identifier, publicKey, encryptedKey);
    this.result = result;
    this.responseNonce = responseNonce;
  }

  static fromPacket(packet: any): RpcResponsePackage {
    return new RpcResponsePackage(
      packet.i.toString(),
      packet.pk.toString(),
      packet.ek.toString(),
      packet.rn,
      packet.rr.toString(),
    )
  }

  toObject(): Object {
    const parentObject = super.toObject();
    return {
      ...parentObject,
      rr: this.result,
      rn: this.responseNonce,
    };
  }
}