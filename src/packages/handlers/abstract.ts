import B2BNet from "../../b2bnet";
import Package from "../entities/abstract";

export default abstract class AbstractHandler {
  b2bnet: B2BNet;

  constructor(b2bnet: B2BNet) {
    this.b2bnet = b2bnet;
  }

  protected parseArguments(args: string) {
    try {
      return JSON.parse(args);
    } catch (e) {
      // console.log("Malformed response JSON: " + responsestring);
      return null;
    }
  }

  public abstract handle(packet: Package): void;
};
