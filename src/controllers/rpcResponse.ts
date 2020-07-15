import BaseController from './base';
import RPCResponseRequest from '../requests/rpcResponse';
import RpcService from '../services/rpc';
import B2BNet from '../b2bnet';

export default class RPCResponseController extends BaseController<
  RPCResponseRequest
> {
  rpcService: RpcService;

  constructor(rpcService: RpcService) {
    super();
    this.rpcService = rpcService;
  }

  public async call(b2bnet: B2BNet, packet: RPCResponseRequest) {
    const nonce = packet.responseNonce;
    const response = this.parseArguments(packet.result);
    const executed = this.rpcService.callResponse(nonce, response);

    if (executed) {
      const address = this.addressService.get(packet.publicKey);
      b2bnet.emit('rpc-response', address, nonce, response);
    }
  }
}
