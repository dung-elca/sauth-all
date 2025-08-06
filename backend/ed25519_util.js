import crypto from "crypto";

class AppKeyPair {
  constructor(publicKey, privateKey) {
    this.publicKey = publicKey;
    this.privateKey = privateKey;
  }
}

class Ed25519Util {
  async generateKeyPair() {
    return new Promise((resolve, reject) => {
      crypto.generateKeyPair(
        "ed25519",
        {
          publicKeyEncoding: { type: "spki", format: "pem" },
          privateKeyEncoding: { type: "pkcs8", format: "pem" },
        },
        (err, publicKey, privateKey) => {
          if (err) {
            reject(err);
          } else {
            resolve(new AppKeyPair(publicKey, privateKey));
          }
        }
      );
    });
  }

  async sign(message, privateKey) {
    const messageBuffer = Buffer.from(message);
    const privateKeyObject = crypto.createPrivateKey(privateKey);
    return crypto
      .sign(null, messageBuffer, privateKeyObject)
      .toString("base64");
  }

  async verify(message, signature, publicKey) {
    const messageBuffer = Buffer.from(message);
    const signatureBuffer = Buffer.from(signature, "base64");
    const publicKeyObject = crypto.createPublicKey(publicKey);
    return crypto.verify(null, messageBuffer, publicKeyObject, signatureBuffer);
  }
}

const ed25519Util = new Ed25519Util();
export { AppKeyPair, ed25519Util };

// Quick test script
(async () => {
  const message = "Hello, SAuth!";

  // Generate key pair
  const keyPair = await ed25519Util.generateKeyPair();
  console.log("Generated Key Pair:", keyPair);

  // Sign the message
  const signature = await ed25519Util.sign(message, keyPair.privateKey);
  console.log("Signature:", signature);

  // Verify the signature
  const isValid = await ed25519Util.verify(
    message,
    signature,
    keyPair.publicKey
  );
  console.log("Is signature valid?", isValid);
})();
