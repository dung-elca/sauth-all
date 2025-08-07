import { ed25519 } from "@noble/curves/ed25519";
import { bytesToHex, hexToBytes, utf8ToBytes } from "@noble/hashes/utils";
import CryptoJS from "crypto-js";

class AESUtil {
  static encrypt(plainText, passphrase) {
    return CryptoJS.AES.encrypt(plainText, passphrase).toString();
  }

  static decrypt(encryptedText, passphrase) {
    const bytes = CryptoJS.AES.decrypt(encryptedText, passphrase);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}

class Ed25519Util {
  static generateKeyPair() {
    const privKey = ed25519.utils.randomSecretKey();
    const pubKey = ed25519.getPublicKey(privKey);
    return {
      privateKey: bytesToHex(privKey),
      publicKey: bytesToHex(pubKey),
    };
  }

  static verify(message, signature, publicKey) {
    return ed25519.verify(
      hexToBytes(signature),
      utf8ToBytes(message),
      hexToBytes(publicKey)
    );
  }

  static sign(message, privateKey) {
    const signature = ed25519.sign(
      utf8ToBytes(message),
      hexToBytes(privateKey)
    );
    return bytesToHex(signature);
  }
}

export { AESUtil, Ed25519Util };
