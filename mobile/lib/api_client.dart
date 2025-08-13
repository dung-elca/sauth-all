import 'dart:convert';

import 'package:datadome_flutter_dio/datadome_interceptor.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:mobile/secure/aes_util.dart';

class ClientSetting {
  final bool enableDataDome;
  final bool enableReCaptcha;

  ClientSetting({required this.enableDataDome, required this.enableReCaptcha});
}

class ApiClient {
  final String baseUrl;
  final Dio dio = Dio();

  ApiClient(this.baseUrl);

  Future<ClientSetting> _getClientSetting(String clientId) async {
    final response = await dio.get(
      '$baseUrl/mobile/$clientId',
      options: Options(headers: {'Content-Type': 'application/json'}),
    );
    if (response.statusCode == 200) {
      return ClientSetting(
        enableDataDome: response.data['enable_datadome'] ?? false,
        enableReCaptcha: response.data['enable_recaptcha'] ?? false,
      );
    } else {
      throw Exception('Fail to get client Setting ${response.data}');
    }
  }

  Future<String> registerDevice(
    String publicKey,
    String signature,
    String deviceUuid,
    int timestamp,
    String clientId,
    Function(Widget) onChallenge,
    Function() onChallengeResolved,
  ) async {
    dio.interceptors.removeWhere((i) => i is DataDomeInterceptor);
    final clientSetting = await _getClientSetting(clientId);
    if (clientSetting.enableReCaptcha) {
      final interceptor = DataDomeInterceptor.withCallback(
        "KKCpsZoVErvnjFj",
        dio,
        (Widget widget) {
          onChallenge(widget);
        },
        () {
          onChallengeResolved();
        },
      );
      dio.interceptors.add(interceptor);
    }
    final response = await dio.post(
      '$baseUrl/mobile/register-device',
      options: Options(headers: {'Content-Type': 'application/json'}),
      data: jsonEncode({
        'data': AESUtil.encrypt(
          jsonEncode({
            'public_key': publicKey,
            'signature': signature,
            'timestamp': timestamp,
            'device_uuid': deviceUuid,
            'client_id': clientId,
          }),
          "sauth-secret",
        ),
      }),
    );
    if (response.statusCode == 200) {
      return response.data["device_id"] as String;
    } else {
      throw Exception('Failed to register device: ${response.data}');
    }
  }

  Future<String> verifyQrCode(
    String sessionId,
    String nonce,
    String signature,
    String deviceId,
    int timestamp,
    String clientId,
    Function(Widget) onChallenge,
    Function() onChallengeResolved,
  ) async {
    dio.interceptors.removeWhere((i) => i is DataDomeInterceptor);
    final clientSetting = await _getClientSetting(clientId);
    if (clientSetting.enableReCaptcha) {
      final interceptor = DataDomeInterceptor.withCallback(
        "KKCpsZoVErvnjFj",
        dio,
        (Widget widget) {
          onChallenge(widget);
        },
        () {
          onChallengeResolved();
        },
      );
      dio.interceptors.add(interceptor);
    }
    final response = await dio.post(
      '$baseUrl/mobile/verify-qrcode',
      options: Options(headers: {'Content-Type': 'application/json'}),
      data: jsonEncode({
        'data': AESUtil.encrypt(
          jsonEncode({
            'session_id': sessionId,
            'nonce': nonce,
            'signature': signature,
            'device_id': deviceId,
            'timestamp': timestamp,
            'client_id': clientId,
          }),
          "sauth-secret",
        ),
      }),
    );

    if (response.statusCode == 200) {
      return response.data["status"] as String;
    } else {
      throw Exception('Failed to verify QR code: ${response.data}');
    }
  }
}

var apiClient = ApiClient('http://192.168.0.178:3000');
