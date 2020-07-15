import { Wire, ExtensionConstructor } from 'bittorrent-protocol';
import B2BNet from '../b2bnet';
import WalletService from './wallet';
import MessageService from './message';
import AddressService from './address';
import PeerService from './peer';
import Router from './router';

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
  messageService: MessageService;
  addressService: AddressService;
  peerService: PeerService;
  router: Router;

  constructor(
    walletService: WalletService,
    peerService: PeerService,
    router: Router
  ) {
    this.walletService = walletService;
    this.peerService = peerService;
    this.messageService = new MessageService();
    this.addressService = new AddressService();
    this.router = router;
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
    return (buffer: Buffer): void => {
      const hash = this.messageService.hash(buffer);

      if (this.messageService.isNew(hash)) {
        this.router.dispatch(b2bnet, buffer);
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
