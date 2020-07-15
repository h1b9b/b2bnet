import B2BNet from '../../b2bnet';
import RpcCallPackage from '../entities/rpcCall';
import AbstractHandler from './abstract';
import RpcService from '../../services/rpc';
import PacketType from '../types';
import PackageService from '../../services/package';

export default class RPCCallHandler extends AbstractHandler<RpcCallPackage> {
  rpcService: RpcService;
  packageService: PackageService;

  constructor(rpcService: RpcService, packageService: PackageService) {
    super();
    this.rpcService = rpcService;
    this.packageService = packageService;
  }

  public async handle(b2bnet: B2BNet, packet: RpcCallPackage) {
    const nonce = packet.responseNonce;
    const call = packet.call;
    const args = this.parseArguments(packet.args);
    const address = this.addressService.get(packet.publicKey);
    
    const result = await this.rpcService.callApi(address, call, args);
    const responsePackage = this.packageService.build({
      result: JSON.stringify(result),
      responseNonce: nonce,
      type: PacketType.RPCRESPONSE,
    });
    b2bnet.sendPackage(responsePackage, packet.publicKey);
    b2bnet.emit('rpc', address, call, args, nonce);
  }
}
