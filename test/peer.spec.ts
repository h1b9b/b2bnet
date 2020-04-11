import Peer from '../src/peer';

describe('B2BNet Peer', () => {
  it('should create a default peer', () => {
    const peer = new Peer('public key');
    expect(peer.publicKey).toBe('public key');
    expect(peer.timestamp).toBeLessThanOrEqual(Date.now());
    expect(peer.encryptedKey).toBeUndefined();
  });

  it('should return true when peer timed out', () => {
    Date.now = jest.fn(() => 1487076708000);
    const peer = new Peer('public key', 1487076707000);
    expect(peer.timedOut(1000)).toBe(true);
  });

  it('should return true when peer timed out with specific timestamp', () => {
    const peer = new Peer('public key', 1487076707000);
    expect(peer.timedOut(999, 1487076707999)).toBe(true);
  });

  it('should return false when peer did not time out', () => {
    Date.now = jest.fn(() => 1487076708000);
    const peer = new Peer('public key', 1487076707000);
    expect(peer.timedOut(999)).toBe(false);
  });

  it('should update peer', () => {
    const now = 100;
    Date.now = jest.fn(() => now);
    const peer = new Peer('public key', 1487076707000, 'private key');
    peer.update();
    expect(peer.timestamp).toBe(now);
    expect(peer.encryptedKey).toBeUndefined();
    peer.update(42, 'encrypted key')
    expect(peer.timestamp).toBe(42);
    expect(peer.encryptedKey).toBe('encrypted key');
  })
})
