import 'dart:convert';

import 'package:http/http.dart' as http;

class ApiClient {
  final String baseUrl;

  ApiClient(this.baseUrl);

  Future<Map<String, dynamic>> registerDevice(
    String publicKey,
    String signature,
    Map<String, dynamic> deviceInfo,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/mobile/register-device'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'public_key': publicKey,
        'signature': signature,
        'timestamp': DateTime.now().microsecondsSinceEpoch,
        'device_info': deviceInfo,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to register device: ${response.body}');
    }
  }

  Future<Map<String, dynamic>> verifyQrCode(
    String sessionId,
    String nonce,
    String signature,
    String deviceId,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/mobile/verify-qrcode'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'session_id': sessionId,
        'nonce': nonce,
        'signature': signature,
        'device_id': deviceId,
        'timestamp': DateTime.now().microsecondsSinceEpoch,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to verify QR code: ${response.body}');
    }
  }
}

var apiClient = ApiClient('http://localhost:3000');
