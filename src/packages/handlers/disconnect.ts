import B2BNet from '../../b2bnet';
import DisconnectPackage from '../entities/disconnect';
import AbstractHandler from './abstract';
import PeerService from '../../services/peer';

export default class DisconectHandler extends AbstractHandler<DisconnectPackage> {
  peerService: PeerService;

  constructor(peerService: PeerService) {
    super();
    this.peerService = peerService;
  }

  public async handle(b2bnet: B2BNet, packet: DisconnectPackage) {
    const address = this.addressService.get(packet.publicKey);
    this.peerService.removePeer(address);
  }
}
