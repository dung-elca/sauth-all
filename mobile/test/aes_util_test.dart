import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/secure/aes_util.dart';

void main() {
  const plainText = 'Hello Sauth!';
  const passphrase = 'mySecretKey123';

  test('AES encrypt and decrypt should return original text', () {
    final encrypted = AESUtil.encrypt(plainText, passphrase);
    final decrypted = AESUtil.decrypt(encrypted, passphrase);
    expect(decrypted, plainText);
  });

  test('AES hash should return correct SHA256', () {
    final hash = AESUtil.hash(plainText);
    expect(hash.length, 64); // SHA256 always 64 hex chars
  });

  test('AES encryptInBackground and decryptInBackground', () async {
    final encrypted = await AESUtil.encryptInBackground(plainText, passphrase);
    final decrypted = await AESUtil.decryptInBackground(encrypted, passphrase);
    expect(decrypted, plainText);
  });
}
