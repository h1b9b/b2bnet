import BaseController from './base';
import MessageRequest from '../requests/message';
import B2BNet from '../b2bnet';

export default class MessageController extends BaseController<MessageRequest> {
  public async call(b2bnet: B2BNet, packet: MessageRequest) {
    const message = this.parseArguments(packet.message);
    const from = this.addressService.get(packet.publicKey);
    b2bnet.emit('message', from, message);
  }
}
