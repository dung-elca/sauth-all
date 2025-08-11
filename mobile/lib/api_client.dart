import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:mobile/secure/aes_util.dart';

class ApiClient {
  final String baseUrl;

  ApiClient(this.baseUrl);

  Future<String> registerDevice(
    String publicKey,
    String signature,
    String deviceUuid,
    int timestamp,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/mobile/register-device'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'data': AESUtil.encrypt(
          jsonEncode({
            'public_key': publicKey,
            'signature': signature,
            'timestamp': timestamp,
            'device_uuid': deviceUuid,
          }),
          "sauth-secret",
        ),
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body)["device_id"] as String;
    } else {
      throw Exception('Failed to register device: ${response.body}');
    }
  }

  Future<String> verifyQrCode(
    String sessionId,
    String nonce,
    String signature,
    String deviceId,
    int timestamp,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/mobile/verify-qrcode'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'data': AESUtil.encrypt(
          jsonEncode({
            'session_id': sessionId,
            'nonce': nonce,
            'signature': signature,
            'device_id': deviceId,
            'timestamp': timestamp,
          }),
          "sauth-secret",
        ),
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body)["status"] as String;
    } else {
      throw Exception('Failed to verify QR code: ${response.body}');
    }
  }
}

var apiClient = ApiClient('http://192.168.1.8:3000');
