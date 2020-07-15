import BaseController from './base';
import DisconnectRequest from '../requests/disconnect';
import B2BNet from '../b2bnet';
import PeerService from '../services/peer';

export default class DisconectController extends BaseController<
  DisconnectRequest
> {
  peerService: PeerService;

  constructor(peerService: PeerService) {
    super();
    this.peerService = peerService;
  }

  public async call(b2bnet: B2BNet, packet: DisconnectRequest) {
    const address = this.addressService.get(packet.publicKey);
    this.peerService.removePeer(address);
  }
}
