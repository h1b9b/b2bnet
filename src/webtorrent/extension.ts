import { Wire, ExtensionConstructor } from 'bittorrent-protocol';
import B2BNet from '../b2bnet';

export const EXT = "bo_channel";

interface WireInterface extends Wire {
  extendedHandshake: {
    id: string,
    pk: string,
    ek: string,
  }
}

function buildOnExtendedHandshake(b2bnet: B2BNet, wire: WireInterface) {
  return (handshake: { [key: string]: any }): void => {
    b2bnet.handshake();
    b2bnet.sawPeer(handshake.pk.toString(), handshake.ek.toString());
  }
}

function buildOnMessage(b2bnet: B2BNet) {
  return (message: Buffer): void => {
    const hash = b2bnet.messageService.hash(message);

    if (b2bnet.messageService.isNew(hash)) {
      const packet = b2bnet.packageService.decode(message);
      if (packet != null) {
        b2bnet.sawPeer(packet.publicKey, packet.encryptedKey);
        b2bnet.handle(packet);
      }
    }

    b2bnet.messageService.refresh(hash);
  };
}

export default function buildExtention(b2bnet: B2BNet): ExtensionConstructor {
  class ExtendedExtension {
    name: string = EXT;
    onExtendedHandshake?(handshake: { [key: string]: any }): void;
    onMessage?(buffer: Buffer): void;

    constructor(wire: Wire) {
      const extendedWire: WireInterface = <WireInterface>wire;
      extendedWire.extendedHandshake = {
        id: b2bnet.identifier,
        pk: b2bnet.publicKey,
        ek: b2bnet.encryptedKey,
      };

      this.onMessage = buildOnMessage(b2bnet);
      this.onExtendedHandshake = buildOnExtendedHandshake(b2bnet, extendedWire);
    }
  }

  ExtendedExtension.prototype.name = EXT;

  return ExtendedExtension;
};