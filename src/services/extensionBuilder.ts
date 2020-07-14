import { Wire, ExtensionConstructor } from 'bittorrent-protocol';
import B2BNet from '../b2bnet';
import WalletService from './wallet';
import PackageService from './package';
import MessageService from './message';
import AddressService from './address';
import PeerService from './peer';
import EventService from './events';

export const EXT = 'b2b_channel';

interface WireInterface extends Wire {
  extendedHandshake: {
    id: string;
    pk: string;
    ek: string;
  };
}

export class WireExtensionBuilder {
  walletService: WalletService;
  packageService: PackageService;
  messageService: MessageService;
  addressService: AddressService;
  peerService: PeerService;
  eventService: EventService;

  constructor(
    walletService: WalletService,
    packageService: PackageService,
    peerService: PeerService,
    eventService: EventService,
  ) {
    this.walletService = walletService;
    this.packageService = packageService;
    this.messageService = new MessageService();
    this.addressService = new AddressService();
    this.eventService = eventService;
    this.peerService = peerService;
  }

  onExtendedHandshake() {
    return (handshake: { [key: string]: any }): void => {
      const publicKey = handshake.pk.toString();
      const encryptedKey = handshake.ek.toString();
      const address = this.addressService.get(publicKey);
      this.peerService.sawPeer(address, publicKey, encryptedKey);
    };
  }

  onMessage(b2bnet: B2BNet) {
    return (message: Buffer): void => {
      const hash = this.messageService.hash(message);

      if (this.messageService.isNew(hash)) {
        const packet = this.packageService.decode(message);
        if (packet != null) {
          const address = this.addressService.get(packet.publicKey);
          this.peerService.sawPeer(address, packet.publicKey, packet.encryptedKey);
          this.packageService.handle(b2bnet, packet);
        }
      }

      this.messageService.refresh(hash);
    };
  }

  get(b2bnet: B2BNet): ExtensionConstructor {
    const builder = this;

    class ExtendedExtension {
      name: string = EXT;
      onExtendedHandshake?(handshake: { [key: string]: any }): void;
      onMessage?(buffer: Buffer): void;

      constructor(wire: Wire) {
        const extendedWire: WireInterface = wire as WireInterface;
        extendedWire.extendedHandshake = {
          id: builder.walletService.identifier,
          pk: builder.walletService.publicKey,
          ek: builder.walletService.encryptedKey,
        };

        this.onMessage = builder.onMessage(b2bnet);
        this.onExtendedHandshake = builder.onExtendedHandshake();
      }
    }

    ExtendedExtension.prototype.name = EXT;

    return ExtendedExtension;
  }
}
