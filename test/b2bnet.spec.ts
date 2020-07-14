import B2BNet from '../src/b2bnet';

describe('B2BNet', () => {
  describe('Instantiation', () => {
    let b2bnet: B2BNet;

    beforeAll(() => {
      b2bnet = new B2BNet(null, {
        seed: 'BohNtZ24TrgMwZTLx9VDKtcZARNVuCt5tnecAAxYtTBC8pC61uGN',
      });
    });

    afterAll(() => {
      b2bnet.close();
    });

    it('should set server identifier', () => {
      expect(b2bnet.walletService.identifier).toBe('bYSkTy24xXJj6dWe79ZAQXKJZrn2n983SQ');
    });

    it('should set server public key', () => {
      expect(b2bnet.walletService.publicKey).toBe(
        'CXENBY9X3x5TN1yjRyu1U1WkGuujuVBNiqxA16oAYbFo'
      );
    });

    it('should be able to get server address from public key', () => {
      expect(b2bnet.walletService.identifier).toBe(
        b2bnet.addressService.get('CXENBY9X3x5TN1yjRyu1U1WkGuujuVBNiqxA16oAYbFo')
      );
    });

    it('should be able to get server address from public key array', () => {
      expect(b2bnet.walletService.identifier).toBe(b2bnet.addressService.get(b2bnet.walletService.keyPair.publicKey));
    });
  });

  describe('Connectivity events', () => {
    let b2bnetServer: B2BNet;
    let b2bnetClient: B2BNet;

    beforeEach(() => {
      b2bnetServer = new B2BNet();
      b2bnetClient = new B2BNet(b2bnetServer.address);

      // connect the two clients together
      b2bnetServer.eventService.on('webtorrent', 'infoHash', () => {
        b2bnetServer.webTorrentService.addPeer(b2bnetClient.getPublicAddress());
      });
    });

    afterEach(() => {
      b2bnetClient.close();
      b2bnetServer.close();
    });

    it('client see remote server address as peer', (done) => {
      function seenAddress(address: string) {
        try {
          expect(address).toBe(b2bnetServer.address);
          done();
        } catch (error) {
          done(error);
        }
      }
      b2bnetClient.on('seen', seenAddress);
    });

    it('server see remote client address as peer', (done) => {
      function seenAddress(address: string) {
        try {
          expect(address).toBe(b2bnetClient.address);
          done();
        } catch (error) {
          done(error);
        }
      }
      b2bnetServer.on('seen', seenAddress);
    });

    it('client see the server correct address', (done) => {
      function serverSeenAddress(address: string) {
        try {
          expect(address).toBe(b2bnetServer.address);
          done();
        } catch (error) {
          done(error);
        }
      }
      b2bnetClient.on('server', serverSeenAddress);
    });
  });

  describe('RPC and message passing', () => {
    let b2bnetServer: B2BNet;
    let b2bnetClient1: B2BNet;
    let b2bnetClient2: B2BNet;
    const msg = { Hello: 'World' };

    beforeEach((done) => {
      b2bnetServer = new B2BNet(null);
      b2bnetClient1 = new B2BNet(b2bnetServer.address);
      b2bnetClient2 = new B2BNet(b2bnetServer.address);

      b2bnetClient2.on('server', () => {
        done();
      });

      // connect the two clients together
      b2bnetServer.webTorrentService.on('infoHash', () => {
        b2bnetServer.webTorrentService.addPeer(
          b2bnetClient1.getPublicAddress()
        );
        b2bnetServer.webTorrentService.addPeer(
          b2bnetClient2.getPublicAddress()
        );
        b2bnetServer.eventService.emmiter.once('seen', () => {
          setTimeout(() => {
            b2bnetClient1.webTorrentService.addPeer(
              b2bnetClient2.getPublicAddress()
            );
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
      it('server broadcast to all clients', (done) => {
        b2bnetServer.broadcast(msg);

        let expectsCount = 2;
        function expectedMessage(from: string, message: any) {
          try {
            expect(from).toBe(b2bnetServer.address);
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

      it('server should send message to only client 1', (done) => {
        b2bnetServer.send(b2bnetClient1.address, msg);

        function expectedMessage(receiver: string, message: any) {
          try {
            expect(receiver).toBe(b2bnetServer.address);
            expect(message).toEqual(msg);
            expect(client2ExpectMessage).toBeCalledTimes(0);
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
      it('client 1 should ping server and get pong', (done) => {
        async function pingPongApi(address: string, args: object) {
          return { ...args, pong: true };
        }

        b2bnetServer.register('ping', pingPongApi);

        function expectPong(response: any) {
          try {
            expect(response.Hello).toBe(msg.Hello);
            expect(response.pong).toBe(true);
            done();
          } catch (error) {
            done(error);
          }
        }

        if (b2bnetClient1.serveraddress != null) {
          b2bnetClient1.rpc(
            b2bnetClient1.serveraddress,
            'ping',
            msg,
            expectPong
          );
        } else {
          done('No server address');
        }
      });

      it('client 1 should ping client 2 and get pong', (done) => {
        async function pingPongApi(address: string, args: object) {
          return { ...args, pong: true };
        }
        b2bnetServer.register('ping', pingPongApi);

        function expectPong(response: any) {
          try {
            expect(response.Hello).toBe(msg.Hello);
            expect(response.pong).toBe(true);
            done();
          } catch (error) {
            done(error);
          }
        }

        if (b2bnetClient1.serveraddress != null) {
          b2bnetClient1.rpc(
            b2bnetClient1.serveraddress,
            'ping',
            msg,
            expectPong
          );
        } else {
          done('No server address');
        }
      });
    });
  });
});
