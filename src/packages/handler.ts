import B2BNet from "../b2bnet";
import messagePacketHandler from "./handlers/message";
import rpcCallHandler from "./handlers/rpcCall";
import rpcResponseHandler from "./handlers/rpcResponse";
import pingHandler from "./handlers/ping";
import disconnectHandler from "./handlers/disconnect";
import MessagePackage from "./entities/message";
import PingPackage from "./entities/ping";
import DisconnectPackage from "./entities/disconnect";
import RpcResponsePackage from "./entities/rpcResponse";
import RpcCallPackage from "./entities/rpcCall";

export default class PackageHandler {
  b2bnet: B2BNet;

  constructor(b2bnet: B2BNet) {
    this.b2bnet = b2bnet;
  }

  exec(packet: MessagePackage | PingPackage | DisconnectPackage | RpcCallPackage | RpcResponsePackage) {
    if (packet instanceof MessagePackage) {
      return messagePacketHandler(this.b2bnet, packet);
    }
    if (packet instanceof PingPackage) {
      return pingHandler(this.b2bnet, packet);
    }
    if (packet instanceof DisconnectPackage) {
      return disconnectHandler(this.b2bnet, packet);
    }
    if (packet instanceof RpcCallPackage) {
      return rpcCallHandler(this.b2bnet, packet);
    }
    if (packet instanceof RpcResponsePackage) {
      return rpcResponseHandler(this.b2bnet, packet);
    }
  }
}