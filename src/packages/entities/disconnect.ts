import Package from "./abstract";
import PacketType from "../types";

export default class DisconnectPackage extends Package {
  constructor(
    identifier: string,
    publicKey: string,
    encryptedKey: string,
  ) {
    super(PacketType.DISCONNECT, identifier, publicKey, encryptedKey);
  }

  static fromPacket(packet: any): DisconnectPackage {
    return new DisconnectPackage(
      packet.i.toString(),
      packet.pk.toString(),
      packet.ek.toString()
    );
  }
}