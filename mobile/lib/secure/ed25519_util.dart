import 'package:cryptography/cryptography.dart';
import 'package:cryptography/dart.dart';
import 'package:flutter/foundation.dart';

import 'hex.dart';

class AppKeyPair {
  String privateKey;
  String publicKey;

  AppKeyPair(this.privateKey, this.publicKey);
}

class Ed25519Util {
  Future<AppKeyPair> generateKeyPair() async {
    final algorithm = DartEd25519();
    final keyPair = await algorithm.newKeyPair();
    final privateKey = await keyPair.extractPrivateKeyBytes();
    final publicKey = (await keyPair.extractPublicKey()).bytes;
    return AppKeyPair(hex.encode(privateKey), hex.encode(publicKey));
  }

  Future<bool> _verify(List<String> args) {
    final message = args[0];
    final signature = args[1];
    final publicKey = args[2];
    final algorithm = DartEd25519();
    final simPubKey = SimplePublicKey(
      hex.decode(publicKey),
      type: KeyPairType.ed25519,
    );
    final signatureToVerify = Signature(
      hex.decode(signature),
      publicKey: simPubKey,
    );
    return algorithm.verifyString(message, signature: signatureToVerify);
  }

  Future<bool> verify(String message, String signature, String publicKey) {
    return _verify([message, signature, publicKey]);
  }

  Future<bool> verifyInBackground(
    String message,
    String signature,
    String publicKey,
  ) {
    return compute(_verify, [message, signature, publicKey]);
  }

  Future<String> _sign(List<String> args) async {
    final message = args[0];
    final privateKey = args[1];
    final algorithm = DartEd25519();
    final keyPair = await algorithm.newKeyPairFromSeed(hex.decode(privateKey));
    final signature = await algorithm.signString(message, keyPair: keyPair);
    return hex.encode(signature.bytes);
  }

  Future<String> sign(String message, String privateKey) async {
    return _sign([message, privateKey]);
  }

  Future<String> signInBackground(String message, String privateKey) async {
    return compute(_sign, [message, privateKey]);
  }
}

var ed25519Util = Ed25519Util();
