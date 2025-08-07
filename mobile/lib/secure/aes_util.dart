import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';

import 'package:crypto/crypto.dart';
import 'package:encrypt/encrypt.dart';
import 'package:flutter/foundation.dart' as foundation;

class AESUtil {
  AESUtil._init();

  static String _encrypt(List<String> args) {
    final plainText = args[0];
    final passphrase = args[1];
    final salt = _AESUtil._genRandomWithNonZero(8);
    var keyndIV = _AESUtil._deriveKeyAndIV(passphrase, salt);
    final key = Key(keyndIV.item1);
    final iv = IV(keyndIV.item2);

    final encrypter = Encrypter(AES(key, mode: AESMode.cbc, padding: "PKCS7"));
    final encrypted = encrypter.encrypt(plainText, iv: iv);
    Uint8List encryptedBytesWithSalt = Uint8List.fromList(
      utf8.encode("Salted__") + salt + encrypted.bytes,
    );
    return base64.encode(encryptedBytesWithSalt);
  }

  static String encrypt(String plainText, String passphrase) {
    return _encrypt([plainText, passphrase]);
  }

  static Future<String> encryptInBackground(
    String plainText,
    String passphrase,
  ) {
    return foundation.compute(_encrypt, [plainText, passphrase]);
  }

  static String _decrypt(List<String> args) {
    final encrypted = args[0];
    final passphrase = args[1];
    Uint8List encryptedBytesWithSalt = base64.decode(encrypted);

    Uint8List encryptedBytes = encryptedBytesWithSalt.sublist(
      16,
      encryptedBytesWithSalt.length,
    );
    final salt = encryptedBytesWithSalt.sublist(8, 16);
    var keyndIV = _AESUtil._deriveKeyAndIV(passphrase, salt);
    final key = Key(keyndIV.item1);
    final iv = IV(keyndIV.item2);

    final encrypter = Encrypter(AES(key, mode: AESMode.cbc, padding: "PKCS7"));
    final decrypted = encrypter.decrypt64(
      base64.encode(encryptedBytes),
      iv: iv,
    );
    return decrypted;
  }

  static String decrypt(String encrypted, String passphrase) {
    return _decrypt([encrypted, passphrase]);
  }

  static Future<String> decryptInBackground(
    String encrypted,
    String passphrase,
  ) {
    return foundation.compute(_decrypt, [encrypted, passphrase]);
  }

  static String hash(String text) {
    return sha256.convert(utf8.encode(text)).toString();
  }
}

class _Tuple2<T1, T2> {
  final T1 item1;
  final T2 item2;

  _Tuple2(this.item1, this.item2);
}

// Private class
class _AESUtil {
  static _Tuple2<Uint8List, Uint8List> _deriveKeyAndIV(
    String passphrase,
    Uint8List salt,
  ) {
    var password = utf8.encode(passphrase);
    Uint8List concatenatedHashes = Uint8List(0);
    Uint8List currentHash = Uint8List(0);
    bool enoughBytesForKey = false;
    Uint8List preHash = Uint8List(0);

    while (!enoughBytesForKey) {
      if (currentHash.isNotEmpty) {
        preHash = Uint8List.fromList(currentHash + password + salt);
      } else {
        preHash = Uint8List.fromList(password + salt);
      }

      currentHash = Uint8List.fromList(md5.convert(preHash).bytes);
      concatenatedHashes = Uint8List.fromList(concatenatedHashes + currentHash);
      if (concatenatedHashes.length >= 48) enoughBytesForKey = true;
    }

    var keyBtyes = concatenatedHashes.sublist(0, 32);
    var ivBtyes = concatenatedHashes.sublist(32, 48);
    return _Tuple2(keyBtyes, ivBtyes);
  }

  static Uint8List _genRandomWithNonZero(int seedLength) {
    final random = Random.secure();
    const int randomMax = 245;
    final Uint8List uint8list = Uint8List(seedLength);
    for (int i = 0; i < seedLength; i++) {
      uint8list[i] = random.nextInt(randomMax) + 1;
    }
    return uint8list;
  }
}
