import nacl from 'tweetnacl';
import { toHex } from '../util';

export type RpcApiFunction = (address: string, arg: any) => Promise<any>;

export default class RpcService {
  api: { [key: string]: RpcApiFunction } = {};
  callbacks: any = {};

  registerApi(name: string, func: RpcApiFunction) {
    this.api[name] = func;
  }

  registerCallBack(callback?: CallableFunction): Uint8Array {
    const nonce = nacl.randomBytes(8);
    this.callbacks[toHex(nonce)] = callback;
    return nonce;
  }

  callResponse(nonce: Uint8Array, response?: any): boolean {
    const nonceString = toHex(nonce);
    const callback = this.callbacks[nonceString];
    if (callback) {
      callback(response);
      delete this.callbacks[nonceString];

      return true;
    }

    return false;
  }

  callApi(from: string, call: string, args: any): Promise<any> {
    const apiCall = this.api[call];
    if (apiCall) {
      try {
        return apiCall(from, args);
      } catch (error) {
        return Promise.resolve({ error });
      }
    }

    return Promise.resolve({ error: 'No such API call.' });
  }
}
