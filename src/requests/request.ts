import nacl from 'tweetnacl';

export default abstract class Request {
  type: string;
  identifier: string;
  publicKey: string;
  encryptedKey: string;
  nonce: Uint8Array;
  timestamp: number;

  constructor(
    type: string,
    identifier: string,
    publicKey: string,
    encryptedKey: string,
    nonce: Uint8Array = nacl.randomBytes(8),
    timestamp: number = Date.now()
  ) {
    this.type = type;
    this.identifier = identifier;
    this.publicKey = publicKey;
    this.encryptedKey = encryptedKey;
    this.nonce = nonce;
    this.timestamp = timestamp;
  }

  toObject(): object {
    return {
      y: this.type,
      t: Date.now(),
      i: this.identifier,
      pk: this.publicKey,
      ek: this.encryptedKey,
      n: this.nonce,
    };
  }

  isValid(identifier: string, timeout: number): boolean {
    const checkid = this.identifier === identifier;
    const checktime = this.timestamp + timeout > Date.now();

    return checkid === true && checktime === true;
  }
}
