import B2BNet from "../../b2bnet";
import DisconnectPackage from "../entities/disconnect";

export default function disconnectHandler(b2bnet: B2BNet, packet: DisconnectPackage) {
  const address = b2bnet.address(packet.publicKey);
  b2bnet.peerService.removePeer(address);
}