import B2BNet from '../../b2bnet';
import MessagePackage from '../entities/message';
import AbstractHandler from './abstract';

export default class MessageHandler extends AbstractHandler<MessagePackage> {
  public async handle(b2bnet: B2BNet, packet: MessagePackage) {
    const message = this.parseArguments(packet.message);
    const from = this.addressService.get(packet.publicKey);
    b2bnet.emit('message', from, message);
  }
}
