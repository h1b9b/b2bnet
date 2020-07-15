import B2BNet from '../../b2bnet';
import PingPackage from '../entities/ping';
import AbstractHandler from './abstract';

export default class PingHandler extends AbstractHandler<PingPackage> {
  public async handle(b2bnet: B2BNet, packet: PingPackage) {
    const from = this.addressService.get(packet.publicKey);
  }
}
