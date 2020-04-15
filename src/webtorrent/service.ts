import WebTorrent from 'webtorrent';
import BitTorrent from 'bittorrent-protocol';
import SimplePeer from 'simple-peer';
import { EventEmitter } from 'events';
import nacl from 'tweetnacl';
import { EXT } from './extension';
import { toHex } from '../util';

interface TorrentInterface extends WebTorrent.Torrent {
  wires: Array<BitTorrent.Wire>;
}

export interface WebTorrentOptions {
  tracker?: {};
  announce?: string[];
  torrentOpts?: {};
  iceServers?: boolean;
  webtorrent?: WebTorrent.Instance;
  webtorrentOpts?: { [key: string]: any };
}

export default class WebTorrentService extends EventEmitter {
  webtorrent: WebTorrent.Instance;
  torrent: TorrentInterface;
  lastPeersCount: number = 0;
  extensions: Array<string> = [];
  infoHash?: string;

  constructor(
    identifier: string,
    extensions: Array<BitTorrent.ExtensionConstructor> = [],
    options: WebTorrentOptions = {}
  ) {
    super();
    options.announce = options.announce || ["wss://hub.bugout.link", "wss://tracker.openwebtorrent.com", "wss://tracker.btorrent.xyz"],

      this.webtorrent = options.webtorrent || new WebTorrent(this.buildOptions(options));
    this.torrent = this.initializeTorrent(identifier, options);
    this.torrent.on("wire", this.attachExtensions(extensions));
    this.torrent.on("infoHash", () => {
      this.emit('infoHash');
    });
  }

  private initializeTorrent(identifier: string, options: WebTorrentOptions): TorrentInterface {
    // if (typeof(File) == "object") {
    //   var blob = new File([this.identifier], this.identifier);
    // } else {
    const blob = Buffer.from(identifier);
    // blob.name = this.identifier;
    // }

    return <TorrentInterface>this.webtorrent.seed(
      blob,
      { "name": identifier, "announce": options.announce, ...options.torrentOpts },
      this.initTorrent(identifier).bind(this)
    );
  }

  private initTorrent(identifier: string) {
    const self = this;

    return (torrent: any) => {
      // log("torrent", identifier, torrent);
      if (torrent.discovery.tracker) {
        torrent.discovery.tracker.on(
          "update",
          function (update: any) {
            self.emit("tracker", identifier, update);
          }
        );
      }

      torrent.discovery.on("trackerAnnounce", function () {
        self.emit("announce", identifier);
        self.connections();
      });
    }
  }

  private buildOptions(options: WebTorrentOptions) {
    const { iceServers, tracker } = options;
    const webtorrentOpts = options.webtorrentOpts || {};
    if (tracker) {
      return {
        tracker: { ...tracker, rtcConfig: iceServers ? { iceServers } : undefined },
        ...webtorrentOpts
      }
    }

    return webtorrentOpts;
  }

  connections(): number {
    if (this.torrent.numPeers !== this.lastPeersCount) {
      this.lastPeersCount = this.torrent.numPeers;
      this.emit('connections', this.torrent.numPeers);
    }

    return this.lastPeersCount;
  }

  private attachExtensions(extensions: Array<BitTorrent.ExtensionConstructor>) {
    return (wire: BitTorrent.Wire, addr?: string) => {
      extensions.forEach(extension => {
        this.extensions.push(extension.name);
        wire.use(extension);
      });
      wire.on("close", this.detach(wire).bind(this));
    };
  }

  private detach(wire: BitTorrent.Wire) {
    return () => {
      this.emit("wireleft", this.torrent.wires.length, wire);
      this.connections();
    }
  }

  destroy(callback?: (err: string | Error) => void) {
    this.webtorrent.destroy(callback);
  }

  send(message: Uint8Array) {
    const { wires } = this.torrent;
    for (let i = 0; i < wires.length; i++) {
      const wire = wires[i];
      const peerExtendedMapping = wire["peerExtendedMapping"];
      if (peerExtendedMapping[EXT]) {
        wire.extended(EXT, message);
      }
    }
    return toHex(nacl.hash(message).slice(16));
  }

  addPeer(peer: string | SimplePeer.Instance): boolean {
    return this.torrent.addPeer(peer);
  }
}