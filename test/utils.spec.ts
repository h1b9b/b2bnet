import { toHex } from '../src/util';

describe('B2BNet util', () => {
  describe('toHex', () => {
    it('should convert UInt8Array to hex string', () => {
      const array = new Uint8Array([1, 17, 255, 45, 38]);
      expect(toHex(array)).toBe('0111ff2d26');
    });
  });
});
