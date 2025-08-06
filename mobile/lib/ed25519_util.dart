import 'dart:convert';

import 'package:cryptography/cryptography.dart';

class AppKeyPair {
  final String publicKey;
  final String privateKey;

  AppKeyPair({required this.publicKey, required this.privateKey});
}

class Ed25519Util {
  final algorithm = Ed25519();

  Future<AppKeyPair> generateKeyPair() async {
    final keyPair = await algorithm.newKeyPair();
    final publicKey = await keyPair.extractPublicKey();

    return AppKeyPair(
      publicKey: base64Encode(publicKey.bytes),
      privateKey: base64Encode(await keyPair.extractPrivateKeyBytes()),
    );
  }

  Future<String> sign(String message, String privateKey) async {
    final messageBytes = utf8.encode(message);
    final privateKeyBytes = base64Decode(privateKey);
    final publicKeyBytes = await algorithm.newKeyPair().then(
      (kp) => kp.extractPublicKey().then((pk) => pk.bytes),
    );
    final keyPair = SimpleKeyPairData(
      privateKeyBytes,
      publicKey: SimplePublicKey(publicKeyBytes, type: KeyPairType.ed25519),
      type: KeyPairType.ed25519,
    );

    final signature = await algorithm.sign(messageBytes, keyPair: keyPair);

    return base64Encode(signature.bytes);
  }

  Future<bool> verify(
    String message,
    String signature,
    String publicKey,
  ) async {
    final messageBytes = utf8.encode(message);
    final signatureBytes = base64Decode(signature);
    final publicKeyBytes = base64Decode(publicKey);
    final publicKeyObj = SimplePublicKey(
      publicKeyBytes,
      type: KeyPairType.ed25519,
    );

    return await algorithm.verify(
      messageBytes,
      signature: Signature(signatureBytes, publicKey: publicKeyObj),
    );
  }
}

var ed25519Util = Ed25519Util();
