import B2BNet from '../../b2bnet';
import RpcCallPackage from '../entities/rpcCall';

function parseArguments(args: string) {
  try {
    return JSON.parse(args);
  } catch (e) {
    // console.log("Malformed response JSON: " + responsestring);
    return null;
  }
}

export default async function rpcCallHandler(
  b2bnet: B2BNet,
  packet: RpcCallPackage
) {
  // log("rpc", b2bnet.identifier, packet);
  const nonce = packet.responseNonce;
  const call = packet.call;
  const args = parseArguments(packet.args);
  const address = b2bnet.addressService.get(packet.publicKey);

  const result = await b2bnet.rpcService.callApi(address, call, args);
  const responsePackage = b2bnet.rpcService.buildResponsePackage(result, nonce);
  b2bnet.sendPackage(responsePackage, packet.publicKey);
  b2bnet.emit('rpc', address, call, args, nonce);
}
