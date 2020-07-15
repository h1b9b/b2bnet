import { EventEmitter } from "events";
import WalletService from "./wallet";

type Event = {
  host: string,
  service: string,
  event: string | symbol,
  args: any[]
}

export default class EventService {
  host: string;
  events: Event[];
  emmiter: EventEmitter;

  constructor(walletService: WalletService) {
    this.host = walletService.address;
    this.events = [];
    this.emmiter = new EventEmitter();
  }

  emit(service: string, event: string, ...args: any[]): boolean {
    this.events.push({ host: this.host, service, event, args });
    
    return this.emmiter.emit(`${service}-${event}`, ...args);
  }

  on(service: string, event: string, listener : (...args: any[]) => void): EventService {
    this.emmiter.on(`${service}-${event}`, listener);

    return this;
  }
}

