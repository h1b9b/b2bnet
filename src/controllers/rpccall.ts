import BaseController from './base';
import RPCCallRequest from '../requests/rpcCall';
import RpcService from '../services/rpc';
import B2BNet from '../b2bnet';
import RequestBuilder from '../services/requestBuilder';
import RequestType from '../requests/types';

export default class RPCCallController extends BaseController<RPCCallRequest> {
  rpcService: RpcService;
  requestBuilder: RequestBuilder;

  constructor(rpcService: RpcService, requestBuilder: RequestBuilder) {
    super();
    this.rpcService = rpcService;
    this.requestBuilder = requestBuilder;
  }

  public async call(b2bnet: B2BNet, packet: RPCCallRequest) {
    const nonce = packet.responseNonce;
    const call = packet.call;
    const args = this.parseArguments(packet.args);
    const address = this.addressService.get(packet.publicKey);

    const result = await this.rpcService.callApi(address, call, args);
    const request = this.requestBuilder.build({
      result: JSON.stringify(result),
      responseNonce: nonce,
      type: RequestType.RPCRESPONSE,
    });
    b2bnet.sendPackage(request, packet.publicKey);
    b2bnet.emit('rpc', address, call, args, nonce);
  }
}
