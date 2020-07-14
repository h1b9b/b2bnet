import WebTorrent from 'webtorrent';
import BitTorrent from 'bittorrent-protocol';
import SimplePeer from 'simple-peer';
import { AddressInfo } from 'net';
import nacl from 'tweetnacl';
import { EXT, WireExtensionBuilder } from '../webtorrent/extension';
import { toHex } from '../util';
import B2BNet from '../b2bnet';
import EventService from './events';
import WalletService from './wallet';
import PackageService from './package';
import MessageService from './message';
import PeerService from './peer';

interface TorrentInterface extends WebTorrent.Torrent {
  wires: BitTorrent.Wire[];
}

export interface WebTorrentInterface extends WebTorrent.Instance {
  address(): AddressInfo;
}

export interface WebTorrentOptions {
  tracker?: {};
  announce?: string[];
  torrentOpts?: {};
  iceServers?: boolean;
  webtorrent?: WebTorrentInterface;
  webtorrentOpts?: { [key: string]: any };
}

export default class WebTorrentService {
  eventService: EventService;
  webtorrent: WebTorrentInterface;
  torrent: TorrentInterface;
  extensions: string[] = [];
  infoHash?: string;

  constructor(
    b2bnet: B2BNet,
    options: WebTorrentOptions = {},
    walletService: WalletService,
    packageService: PackageService,
    messageService: MessageService,
    peerService: PeerService,
    eventService: EventService,
  ) {
    const wireExtensionBuilder = new WireExtensionBuilder(
      walletService,
      packageService,
      messageService,
      peerService,
      eventService
    );
    this.eventService = eventService;
    options.announce = options.announce || [
            'wss://hub.bugout.link',
            'wss://tracker.openwebtorrent.com',
            'wss://tracker.btorrent.xyz',
          ];
    this.webtorrent =
    options.webtorrent ||
      (new WebTorrent(this.buildOptions(options)) as WebTorrentInterface);
      
    this.torrent = this.initializeTorrent(
      walletService.identifier,
      options.announce,
      options.torrentOpts
    );
    this.torrent.on(
      'wire',
      this.attachExtensions([
        // TODO: Use the new builder service and split b2bnet usage
        wireExtensionBuilder.get(b2bnet),
      ])
    );
    this.torrent.on('infoHash', () => this.emit('infoHash'));
  }

  private initializeTorrent(
    identifier: string,
    announce?: string[],
    torrentOpts?: {}
  ): TorrentInterface {
    const options = {
      name: identifier,
      announce,
      ...torrentOpts,
    };
    const blob = Buffer.from(identifier);

    return this.webtorrent.seed(
      blob,
      options,
      this.initTorrent(identifier).bind(this)
    ) as TorrentInterface;
  }

  private initTorrent(identifier: string) {
    const self = this;

    return (torrent: any) => {
      // log("torrent", identifier, torrent);
      if (torrent.discovery.tracker) {
        torrent.discovery.tracker.on('update', (update: any) => {
          self.emit('tracker', identifier, update);
        });
      }

      torrent.discovery.on('trackerAnnounce', () => {
        self.emit('announce', identifier);
      });
    };
  }

  private buildOptions(options: WebTorrentOptions) {
    const { iceServers, tracker } = options;
    const webtorrentOpts = options.webtorrentOpts || {};
    if (tracker) {
      return {
        tracker: {
          ...tracker,
          rtcConfig: iceServers ? { iceServers } : undefined,
        },
        ...webtorrentOpts,
      };
    }

    return webtorrentOpts;
  }

  private attachExtensions(extensions: BitTorrent.ExtensionConstructor[]) {
    return (wire: BitTorrent.Wire, addr?: string) => {
      extensions.forEach((extension) => {
        this.extensions.push(extension.name);
        wire.use(extension);
      });
      wire.on('close', this.detach(wire).bind(this));
    };
  }

  private detach(wire: BitTorrent.Wire) {
    return () => {
      this.emit('wireleft', this.torrent.wires.length, wire);
    };
  }

  destroy(callback?: (err: string | Error) => void) {
    this.webtorrent.destroy(callback);
  }

  send(message: Uint8Array) {
    const { wires } = this.torrent;
    for (const wire of wires) {
      const peerExtendedMapping = wire.peerExtendedMapping;
      if (peerExtendedMapping[EXT]) {
        wire.extended(EXT, message);
      }
    }
    return toHex(nacl.hash(message).slice(16));
  }

  addPeer(peer: string | SimplePeer.Instance): boolean {
    return this.torrent.addPeer(peer);
  }

  getAddress(): string {
    const addressInfo = this.webtorrent.address();
    return `${addressInfo.address}:${addressInfo.port}`;
  }

  emit(event: string, ...args: any[]): boolean {
    return this.eventService.emit('webtorrent', event, ...args);
  }

  on(event: string, listener: (...args: any[]) => void) {
    this.eventService.on('webtorrent', event, listener);
  }
}