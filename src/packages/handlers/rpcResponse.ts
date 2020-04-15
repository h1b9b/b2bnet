import B2BNet from '../../b2bnet';
import RpcResponsePackage from '../entities/rpcResponse';

function parseResponse(response: string) {
  try {
    return JSON.parse(response);
  } catch (e) {
    // console.log("Malformed response JSON: " + responsestring);
    return null;
  }
}

export default function rpcResponseHandler(
  b2bnet: B2BNet,
  packet: RpcResponsePackage
) {
  const nonce = packet.responseNonce;
  const response = parseResponse(packet.result);
  const executed = b2bnet.rpcService.callResponse(nonce, response);

  if (executed) {
    const address = b2bnet.address(packet.publicKey);
    b2bnet.emit('rpc-response', address, nonce, response);
  }
}
