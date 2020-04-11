import PacketType from "./types";
import DisconnectPackage from "./entities/disconnect";
import PingPackage from "./entities/ping";
import RpcResponsePackage from "./entities/rpcResponse";
import RpcCallPackage from "./entities/rpcCall";
import MessagePackage from "./entities/message";
import Package from "./entities/abstract";

export default class PackageFactory {
  parse(packet: any): Package;
  parse(y: PacketType.MESSAGE): MessagePackage;
  parse(y: PacketType.RPCCALL): RpcCallPackage;
  parse(y: PacketType.RPCRESPONSE): RpcResponsePackage;
  parse(y: PacketType.PING): PingPackage;
  parse(y: PacketType.DISCONNECT): DisconnectPackage;

  public parse(packet: any): MessagePackage | RpcCallPackage | RpcResponsePackage | PingPackage | DisconnectPackage {
    switch (packet.y.toString()) {
      case PacketType.MESSAGE:
        return MessagePackage.fromPacket(packet);
      case PacketType.RPCCALL:
        return RpcCallPackage.fromPacket(packet);
      case PacketType.RPCRESPONSE:
        return RpcResponsePackage.fromPacket(packet);
      case PacketType.PING:
        return PingPackage.fromPacket(packet);
      case PacketType.DISCONNECT:
        return DisconnectPackage.fromPacket(packet);
      default:
        console.log(packet);
        throw new Error('Unknown packet type');
    }
  }

  build(packet: any): Package;
  build(type: PacketType.MESSAGE): MessagePackage;
  build(type: PacketType.RPCCALL): RpcCallPackage;
  build(type: PacketType.RPCRESPONSE): RpcResponsePackage;
  build(type: PacketType.PING): PingPackage;
  build(type: PacketType.DISCONNECT): DisconnectPackage;

  public build(option: any): MessagePackage | RpcCallPackage | RpcResponsePackage | PingPackage | DisconnectPackage {
    switch (option.type) {
      case PacketType.MESSAGE:
        return new MessagePackage(
          option.identifier,
          option.publicKey,
          option.encryptedKey,
          option.message
        );
      case PacketType.RPCCALL:
        return new RpcCallPackage(
          option.identifier,
          option.publicKey,
          option.encryptedKey,
          option.call,
          option.args,
          option.responseNonce
        );
      case PacketType.RPCRESPONSE:
        return new RpcResponsePackage(
          option.identifier,
          option.publicKey,
          option.encryptedKey,
          option.responseNonce,
          option.result,
        );
      case PacketType.PING:
        return new PingPackage(
          option.identifier,
          option.publicKey,
          option.encryptedKey
        );
      case PacketType.DISCONNECT:
        return new DisconnectPackage(
          option.identifier,
          option.publicKey,
          option.encryptedKey
        );
      default:
        throw new Error('Unknown packet type');
    }
  }
}