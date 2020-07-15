import B2BNet from '../../b2bnet';
import RpcResponsePackage from '../entities/rpcResponse';
import AbstractHandler from './abstract';
import RpcService from '../../services/rpc';

export default class RPCResponseHandler extends AbstractHandler<RpcResponsePackage> {
  rpcService: RpcService;

  constructor(rpcService: RpcService) {
    super();
    this.rpcService = rpcService;
  }

  public async handle(b2bnet: B2BNet, packet: RpcResponsePackage) {
    const nonce = packet.responseNonce;
    const response = this.parseArguments(packet.result);
    const executed = this.rpcService.callResponse(nonce, response);
  
    if (executed) {
      const address = this.addressService.get(packet.publicKey);
      b2bnet.emit('rpc-response', address, nonce, response);
    }
  }
}
