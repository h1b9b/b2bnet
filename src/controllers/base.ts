import AddressService from '../services/address';
import B2BNet from '../b2bnet';
import Request from '../requests/request';

export default abstract class BaseController<T extends Request> {
  addressService: AddressService;

  constructor() {
    this.addressService = new AddressService();
  }

  protected parseArguments(args?: string) {
    try {
      if (args != null) {
        return JSON.parse(args);
      }
    } catch (e) {
      // console.log("Malformed response JSON: " + responsestring);
      return null;
    }
  }

  public abstract async call(b2bnet: B2BNet, packet: T): Promise<any>;
}
