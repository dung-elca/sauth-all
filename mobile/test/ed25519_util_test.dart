import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/secure/ed25519_util.dart';

void main() {
  group('Ed25519Util Class Tests', () {
    final ed25519Util = Ed25519Util();

    test('KeyPair generation', () async {
      final keyPair = await ed25519Util.generateKeyPair();
      expect(keyPair.publicKey, isNotNull);
      expect(keyPair.privateKey, isNotNull);
    });

    test('Signing and Verification', () async {
      final keyPair = await ed25519Util.generateKeyPair();
      final message = 'Test Message';

      // Sign the message
      final signature = await ed25519Util.sign(message, keyPair.privateKey);
      expect(signature, isNotNull);

      // Verify the signature
      final isVerified = await ed25519Util.verify(
        message,
        signature,
        keyPair.publicKey,
      );
      expect(isVerified, isTrue);
    });

    test('Invalid Signature Verification', () async {
      final keyPair = await ed25519Util.generateKeyPair();
      final message = 'Test Message';
      final invalidMessage = 'Invalid Message';

      // Sign the message
      final signature = await ed25519Util.sign(message, keyPair.privateKey);

      // Verify with an invalid message
      final isVerified = await ed25519Util.verify(
        invalidMessage,
        signature,
        keyPair.publicKey,
      );
      expect(isVerified, isFalse);
    });
  });
}
