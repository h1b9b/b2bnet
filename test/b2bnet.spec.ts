import B2BNet from "../src/b2bnet";

describe("B2BNet", () => {
  describe('Instantiation', () => {
    let b2bnet: B2BNet;

    beforeAll(() => {
      b2bnet = new B2BNet(null, { seed: "BohNtZ24TrgMwZTLx9VDKtcZARNVuCt5tnecAAxYtTBC8pC61uGN" });
    });

    afterAll(() => {
      b2bnet.close();
    })

    it('should set server identifier', () => {
      expect(b2bnet.identifier).toBe("bYSkTy24xXJj6dWe79ZAQXKJZrn2n983SQ");
    });

    it('should set server public key', () => {
      expect(b2bnet.publicKey).toBe("CXENBY9X3x5TN1yjRyu1U1WkGuujuVBNiqxA16oAYbFo");
    });

    it('should be able to get server address from public key', () => {
      expect(b2bnet.identifier).toBe(b2bnet.address("CXENBY9X3x5TN1yjRyu1U1WkGuujuVBNiqxA16oAYbFo"));
    });

    it('should be able to get server address from public key array', () => {
      expect(b2bnet.identifier).toBe(b2bnet.address(b2bnet.keyPair.publicKey));
    });
  });

  describe('Connectivity events', () => {
    let b2bnetServer: B2BNet;
    let b2bnetClient: B2BNet;

    beforeEach(() => {
      b2bnetServer = new B2BNet();
      b2bnetClient = new B2BNet(b2bnetServer.address(), { webtorrentOpts: { torrentPort: 39758 } });

      // connect the two clients together
      b2bnetServer.webTorrentService.on("infoHash", function () {
        b2bnetServer.webTorrentService.addPeer("127.0.0.1:39758");
      });
    });

    afterEach(() => {
      b2bnetClient.close();
      b2bnetServer.close();
    });

    it('server see the wire', done => {
      function wireseenCount(count: number) {
        try {
          expect(count).toBe(1);
          done();
        } catch (error) {
          done(error);
        }
      }
      b2bnetServer.on("wireseen", wireseenCount);
    });

    it('client see the wire', done => {
      function wireseenCount(count: number) {
        try {
          expect(count).toBe(1);
          done();
        } catch (error) {
          done(error);
        }
      }
      b2bnetClient.on("wireseen", wireseenCount);
    });

    it('client see remote server address as peer', done => {
      function seenAddress(address: string) {
        try {
          expect(address).toBe(b2bnetServer.address());
          done();
        } catch (error) {
          done(error);
        }
      }
      b2bnetClient.on("seen", seenAddress);
    });

    it('server see remote client address as peer', done => {
      function seenAddress(address: string) {
        try {
          expect(address).toBe(b2bnetClient.address());
          done();
        } catch (error) {
          done(error);
        }
      }
      b2bnetServer.on("seen", seenAddress);
    });

    it('client see the server correct address', done => {
      function serverSeenAddress(address: string) {
        try {
          expect(address).toBe(b2bnetServer.address());
          done();
        } catch (error) {
          done(error);
        }
      }
      b2bnetClient.on("server", serverSeenAddress);
    });
  });

  describe('RPC and message passing', () => {
    let b2bnetServer: B2BNet;
    let b2bnetClient1: B2BNet;
    let b2bnetClient2: B2BNet;
    const msg = { 'Hello': 'World' };

    beforeEach(done => {
      b2bnetServer = new B2BNet(null);
      b2bnetClient1 = new B2BNet(b2bnetServer.address(), { webtorrentOpts: { torrentPort: 39758 } });
      b2bnetClient2 = new B2BNet(b2bnetServer.address(), { webtorrentOpts: { torrentPort: 39759 } });

      b2bnetClient2.on('server', () => { done() });

      // connect the two clients together
      b2bnetServer.webTorrentService.on("infoHash", function () {
        b2bnetServer.webTorrentService.addPeer("127.0.0.1:39758");
        b2bnetServer.webTorrentService.addPeer("127.0.0.1:39759");
        b2bnetServer.once('seen', () => {
          setTimeout(() => {
            b2bnetClient1.webTorrentService.addPeer("127.0.0.1:39759");
          }, 100);
        });
      });
    });

    afterEach(() => {
      b2bnetClient1.close();
      b2bnetClient2.close();
      b2bnetServer.close();
    });

    describe('messages', () => {
      it('server broadcast to all clients', done => {
        b2bnetServer.broadcast(msg);

        let expectsCount = 2;
        function expectedMessage(from: string, message: any) {
          try {
            expect(from).toBe(b2bnetServer.address());
            expect(message).toEqual(msg);
            expectsCount--;

            if (expectsCount < 1) {
              done();
            }
          } catch (error) {
            done(error);
          }
        }

        b2bnetClient1.on('message', expectedMessage);
        b2bnetClient2.on('message', expectedMessage);
      });

      it('server should send message to only client 1', done => {
        b2bnetServer.send(b2bnetClient1.address(), msg);

        function expectedMessage(receiver: string, message: any) {
          try {
            expect(receiver).toBe(b2bnetServer.address());
            expect(message).toEqual(msg);
            expect(client2ExpectMessage).toBeCalledTimes(0)
            done();
          } catch (error) {
            done(error);
          }
        }

        b2bnetClient1.on('message', expectedMessage);
        const client2ExpectMessage = jest.fn();
        b2bnetClient2.on('message', client2ExpectMessage);
      });
    });

    describe('ping', () => {
      it('client 1 should ping server and get pong', done => {
        async function pingPongApi(address: string, args: Object) {
          console.log('Called ping');
          return { ...args, pong: true };
        }

        b2bnetServer.register("ping", pingPongApi);

        function expectPong(response: any) {
          console.log('Called pong');
          try {
            expect(response.Hello).toBe(msg.Hello);
            expect(response.pong).toBe(true)
            done();
          } catch (error) {
            done(error);
          }
        }

        if (b2bnetClient1.serveraddress != null) {
          b2bnetClient1.rpc(b2bnetClient1.serveraddress, "ping", msg, expectPong);
        } else {
          done('No server address');
        }
      });

      it('client 1 should ping client 2 and get pong', done => {
        async function pingPongApi(address: string, args: Object) {
          return { ...args, pong: true };
        }
        b2bnetServer.register("ping", pingPongApi);

        function expectPong(response: any) {
          try {
            expect(response.Hello).toBe(msg.Hello);
            expect(response.pong).toBe(true)
            done();
          } catch (error) {
            done(error);
          }
        }

        if (b2bnetClient1.serveraddress != null) {
          b2bnetClient1.rpc(b2bnetClient1.serveraddress, "ping", msg, expectPong);
        } else {
          done('No server address');
        }
      });
    });
  });
});
