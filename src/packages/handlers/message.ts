import B2BNet from "../../b2bnet";
import MessagePackage from "../entities/message";


function parseMessage(message: string) {
  try {
    return JSON.parse(message);
  } catch (e) {
    // console.log("Malformed response JSON: " + responsestring);
    return null;
  }
}

export default function messagePacketHandler(b2bnet: B2BNet, packet: MessagePackage) {
  // log("message", b2bnet.identifier, packet);
  const message = parseMessage(packet.message)
  const from = b2bnet.address(packet.publicKey);
  b2bnet.emit("message", from, message);
}
