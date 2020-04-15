import nacl from 'tweetnacl';
import { toHex } from '../util';
import PacketType from '../packages/types';
import PackageService from '../packages/service';

export type RpcApiFunction = (address: string, arg: any) => Promise<any>;

export default class RpcService {
  api: { [key: string]: RpcApiFunction } = {};
  callbacks: any = {};
  packageService: PackageService;

  constructor(packageService: PackageService) {
    this.packageService = packageService;
  }

  registerApi(name: string, func: RpcApiFunction) {
    this.api[name] = func;
  }

  registerCallBack(callback?: CallableFunction): Uint8Array {
    const nonce = nacl.randomBytes(8);
    this.callbacks[toHex(nonce)] = callback;
    return nonce;
  }

  buildCallPackage(call: string, responseNonce: Uint8Array, args: any) {
    return this.packageService.build({
      call,
      responseNonce,
      args: JSON.stringify(args),
      type: PacketType.RPCCALL,
    });
  }

  buildResponsePackage(result: any, responseNonce: Uint8Array) {
    return this.packageService.build({
      result: JSON.stringify(result),
      responseNonce,
      type: PacketType.RPCRESPONSE,
    });
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
