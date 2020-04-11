import Package from "./abstract";
import PacketType from "../types";

export default class RpcCallPackage extends Package {
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
    super(PacketType.RPCCALL, identifier, publicKey, encryptedKey);
    this.call = call;
    this.args = args;
    this.responseNonce = responseNonce;
  }

  static fromPacket(packet: any): RpcCallPackage {
    return new RpcCallPackage(
      packet.i.toString(),
      packet.pk.toString(),
      packet.ek.toString(),
      packet.c.toString(),
      packet.a.toString(),
      packet.rn
    )
  }

  toObject(): Object {
    const parentObject = super.toObject();
    return {
      ...parentObject,
      c: this.call,
      a: this.args,
      rn: this.responseNonce,
    };
  }
}