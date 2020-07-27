import B2BNet from '../src/b2bnet';

describe('B2BNet', () => {
  describe('Instantiation', () => {
    it('should init b2bnet server', async () => {
      const b2bnet = new B2BNet(null, {
        seed: 'BohNtZ24TrgMwZTLx9VDKtcZARNVuCt5tnecAAxYtTBC8pC61uGN',
      });
      await b2bnet.Ready;
      expect(b2bnet.identifier).toBe('bYSkTy24xXJj6dWe79ZAQXKJZrn2n983SQ');
      expect(b2bnet.address).toBe(b2bnet.identifier);
      b2bnet.close();
    });
  });

  describe('Connectivity events', () => {
    let b2bnetServer: B2BNet;
    let b2bnetClient: B2BNet;

    beforeEach(async () => {
      b2bnetServer = new B2BNet();
      b2bnetClient = new B2BNet(b2bnetServer.address);

      await b2bnetServer.Ready;
      await b2bnetClient.Ready;
    });

    afterEach(async () => {
      await b2bnetClient.close();
      await b2bnetServer.close();
    });

    it('client see remote server address as peer', async (done) => {
      function seenAddress(address: string) {
        try {
          expect(address).toBe(b2bnetServer.address);
          done();
        } catch (error) {
          done(error);
        }
      }
      b2bnetClient.on('seen', seenAddress);
      // connect the two clients together
      await b2bnetServer.addPeer(b2bnetClient);
    });

    it('client see the server correct address', async (done) => {
      function serverSeenAddress(address: string) {
        try {
          expect(address).toBe(b2bnetServer.address);
          done();
        } catch (error) {
          done(error);
        }
      }
      b2bnetClient.on('server', serverSeenAddress);

      await b2bnetServer.addPeer(b2bnetClient);
    });

    it('server see remote client address as peer', async (done) => {
      function seenAddress(address: string) {
        try {
          expect(address).toBe(b2bnetClient.address);
          done();
        } catch (error) {
          done(error);
        }
      }
      b2bnetServer.on('seen', seenAddress);

      await b2bnetServer.addPeer(b2bnetClient);
    });
  });

  describe('RPC and message passing', () => {
    const msg = { Hello: 'World' };
    describe('messages', () => {
      let b2bnetServer: B2BNet;
      let b2bnetClient1: B2BNet;
      let b2bnetClient2: B2BNet;

      beforeEach(async () => {
        b2bnetServer = new B2BNet();
        b2bnetClient1 = new B2BNet(b2bnetServer.address);
        b2bnetClient2 = new B2BNet(b2bnetServer.address);

        await b2bnetServer.Ready;
        await b2bnetClient1.Ready;
        await b2bnetClient2.Ready;

        await b2bnetServer.addPeer(b2bnetClient1);
        await b2bnetServer.addPeer(b2bnetClient2);
        await b2bnetClient1.addPeer(b2bnetClient2);
      });

      afterEach(async () => {
        await b2bnetClient1.close();
        await b2bnetClient2.close();
        await b2bnetServer.close();
      });

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
      let b2bnetClient: B2BNet;
      let b2bnetServer: B2BNet;

      beforeAll(async () => {
        b2bnetServer = new B2BNet();
        b2bnetClient = new B2BNet(b2bnetServer.identifier);

        await b2bnetServer.Ready;
        await b2bnetClient.Ready;

        // await b2bnetServer.addPeer(b2bnetClient);
        await b2bnetClient.addPeer(b2bnetServer);
      });

      afterAll(async () => {
        await b2bnetClient.close();
        await b2bnetServer.close();
      });

      it('should ping on server', (done) => {
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

        b2bnetClient.rpc(b2bnetServer.address, 'ping', msg, expectPong);
      });

      it('should ping on client', (done) => {
        async function pingPongApi(address: string, args: object) {
          return { ...args, pong: true };
        }

        b2bnetClient.register('ping', pingPongApi);

        function expectPong(response: any) {
          try {
            expect(response.Hello).toBe(msg.Hello);
            expect(response.pong).toBe(true);
            done();
          } catch (error) {
            done(error);
          }
        }

        b2bnetServer.rpc(b2bnetClient.address, 'ping', msg, expectPong);
      });
    });
  });
});
