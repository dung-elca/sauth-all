import { AESUtil, Ed25519Util } from "./my-crypto.js";

(() => {
  const message = "Hello, SAuth!";

  const keyPair = Ed25519Util.generateKeyPair();
  const signature = Ed25519Util.sign(message, keyPair.privateKey);
  const isValid = Ed25519Util.verify(message, signature, keyPair.publicKey);
  console.log("Is ed25519 valid?", isValid);
})();

(() => {
  const message = "Hello, SAuth!";
  const key = "my-secret-key";

  // Generate key pair
  const encrypted = AESUtil.encrypt(message, key);
  const decrypted = AESUtil.decrypt(encrypted, key);
  console.log("Is aes valid?", message === decrypted);
})();
