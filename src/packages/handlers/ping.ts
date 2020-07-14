import PingPackage from '../entities/ping';
import B2BNet from '../../b2bnet';

export default function pingHandler(b2bnet: B2BNet, packet: PingPackage) {
  const from = b2bnet.addressService.get(packet.publicKey);
  // console.log(b2bnet.addressService.get(), 'Ping from', from);
}
