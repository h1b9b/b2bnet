export function toHex(x: Uint8Array): string {
  return x.reduce(function (memo: string, i) {
    return memo + ('0' + i.toString(16)).slice(-2);
  }, '');
}
