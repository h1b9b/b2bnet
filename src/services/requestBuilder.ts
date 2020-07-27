import PingRequest from '../requests/ping';
import RequestType from '../requests/types';
import DisconnectRequest from '../requests/disconnect';
import MessageRequest from '../requests/message';
import Request from '../requests/request';
import WalletService from './wallet';
import RPCCallRequest from '../requests/rpcCall';
import RPCResponseRequest from '../requests/rpcResponse';

export default class RequestBuilder {
  private walletService: WalletService;

  constructor(walletService: WalletService) {
    this.walletService = walletService;
  }

  private factory(object: any): Request {
    switch (object.type) {
      case RequestType.MESSAGE:
        return new MessageRequest(
          object.identifier,
          object.publicKey,
          object.encryptedKey,
          object.message
        );
      case RequestType.RPCCALL:
        return new RPCCallRequest(
          object.identifier,
          object.publicKey,
          object.encryptedKey,
          object.call,
          object.args,
          object.responseNonce
        );
      case RequestType.RPCRESPONSE:
        return new RPCResponseRequest(
          object.identifier,
          object.publicKey,
          object.encryptedKey,
          object.responseNonce,
          object.result
        );
      case RequestType.PING:
        return new PingRequest(
          object.identifier,
          object.publicKey,
          object.encryptedKey
        );
      case RequestType.DISCONNECT:
        return new DisconnectRequest(
          object.identifier,
          object.publicKey,
          object.encryptedKey
        );
      default:
        throw new Error('Unknown packet type');
    }
  }

  public build(object: any): Request {
    return this.factory({
      identifier: this.walletService.identifier,
      publicKey: this.walletService.publicKey,
      encryptedKey: this.walletService.encryptedKey,
      ...object,
    });
  }
}
