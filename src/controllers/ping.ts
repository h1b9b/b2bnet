import BaseController from './base';
import B2BNet from '../b2bnet';
import PingRequest from '../requests/ping';

export default class PingController extends BaseController<PingRequest> {
  public async call(b2bnet: B2BNet, packet: PingRequest) {
    const from = this.addressService.get(packet.publicKey);
  }
}
