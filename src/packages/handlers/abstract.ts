import Package from "../entities/abstract";
import AddressService from "../../services/address";
import B2BNet from "../../b2bnet";

export default abstract class AbstractHandler<T extends Package> {
  addressService: AddressService;

  constructor() {
    this.addressService = new AddressService();
  }

  protected parseArguments(args?: string) {
    try {
      if (args != null) {
        return JSON.parse(args);
      };
    } catch (e) {
      // console.log("Malformed response JSON: " + responsestring);
      return null;
    }
  }

  public async abstract handle(b2bnet: B2BNet, packet: T): Promise<any>;
};
