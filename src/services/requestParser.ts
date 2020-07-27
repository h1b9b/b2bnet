import PingRequest from '../requests/ping';
import RequestType from '../requests/types';
import DisconnectRequest from '../requests/disconnect';
import MessageRequest from '../requests/message';
import RPCCallRequest from '../requests/rpcCall';
import RPCResponseRequest from '../requests/rpcResponse';
import Request from '../requests/request';

export default class RequestParser {
  private parsers: { [key: string]: (x: any) => Request } = {};

  constructor() {
    this.registerParsers();
  }

  private registerParsers() {
    this.parsers[RequestType.PING] = PingRequest.fromPacket;
    this.parsers[RequestType.DISCONNECT] = DisconnectRequest.fromPacket;
    this.parsers[RequestType.MESSAGE] = MessageRequest.fromPacket;
    this.parsers[RequestType.RPCCALL] = RPCCallRequest.fromPacket;
    this.parsers[RequestType.RPCRESPONSE] = RPCResponseRequest.fromPacket;
  }

  public parse(message: any): Request | undefined {
    const parse = this.parsers[message.y.toString()];
    if (parse != null) {
      return parse(message);
    }
  }
}
