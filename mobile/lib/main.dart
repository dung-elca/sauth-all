import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:mobile/api_client.dart';
import 'package:mobile/app_data.dart';
import 'package:mobile/app_storage.dart';
import 'package:mobile/device_util.dart';
import 'package:mobile/navigate.dart';
import 'package:mobile/qrcode_scanner.dart';
import 'package:mobile/secure/ed25519_util.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Sauth Mobile',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
      ),
      home: const MyHomePage(),
    );
  }
}

class MyHomePage extends StatelessWidget {
  const MyHomePage({super.key});

  Future<void> _registerDevice() async {
    final keyPair = await ed25519Util.generateKeyPair();
    final deviceUUID = await getDeviceUUID();
    if (deviceUUID == null) {
      throw Exception('Failed to get device UUID');
    }
    final timestamp = DateTime.now().microsecondsSinceEpoch;
    final signature = await ed25519Util.sign(
      "$deviceUUID:$timestamp:${keyPair.publicKey}",
      keyPair.privateKey,
    );
    final deviceId = await apiClient.registerDevice(
      keyPair.publicKey,
      signature,
      deviceUUID,
      timestamp,
    );
    await appStorage.saveAppData(
      AppData(privateKey: keyPair.privateKey, deviceId: deviceId),
    );
  }

  void _showMessageDialog(
    BuildContext context, {
    required String title,
    required String message,
  }) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(title),
          content: Text(message),
          actions: [
            TextButton(
              onPressed: () {
                popNavigate(context);
              },
              child: const Text('OK'),
            ),
          ],
        );
      },
    );
  }

  void _acceptCodePopup(
    BuildContext context, {
    required String sessionId,
    required String nonce,
    required int expiredTime,
    required AppData appData,
  }) async {
    if (DateTime.now().millisecondsSinceEpoch < expiredTime) {
      showDialog(
        context: context,
        builder: (context) {
          return AlertDialog(
            title: const Text('A Request Detected'),
            content: const Text('Would you like to accept this request?'),
            actions: [
              TextButton(
                onPressed: () {
                  popNavigate(context);
                  _acceptCode(
                    context,
                    sessionId: sessionId,
                    nonce: nonce,
                    expiredTime: expiredTime,
                    appData: appData,
                  );
                },
                child: const Text('Accept'),
              ),
              TextButton(
                onPressed: () {
                  popNavigate(context);
                },
                child: const Text('Cancel'),
              ),
            ],
          );
        },
      );
    }
  }

  void _acceptCode(
    BuildContext context, {
    required String sessionId,
    required String nonce,
    required int expiredTime,
    required AppData appData,
  }) async {
    final timestamp = DateTime.now().microsecondsSinceEpoch;
    final deviceId = appData.deviceId;
    final signature = await ed25519Util.sign(
      "$sessionId:$nonce:$deviceId:$expiredTime",
      appData.privateKey,
    );
    try {
      final status = await apiClient.verifyQrCode(
        sessionId,
        nonce,
        signature,
        deviceId,
        timestamp,
      );
      if (context.mounted) {
        if (status == 'success') {
          _showMessageDialog(
            context,
            title: "Sucessfully",
            message: "Request accepted.",
          );
        } else {
          _showMessageDialog(
            context,
            title: "Failed",
            message: "Request failed: $status",
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        _showMessageDialog(context, title: "Error", message: e.toString());
      }
    }
  }

  void _scan(BuildContext context) async {
    final appData = await appStorage.getAppData();
    if (appData == null) {
      await _registerDevice();
    }
    if (context.mounted) {
      presentNavigate(
        context,
        QrcodeScanner(
          onCanceled: () {
            popNavigate(context);
          },
          onCodeDetected: (code) async {
            try {
              final json = jsonDecode(code) as Map<String, dynamic>;
              final sessionId = json['session_id'] as String?;
              final nonce = json['nonce'] as String?;
              final expiredTime = json['expired_time'] as int?;
              if (sessionId != null &&
                  nonce != null &&
                  expiredTime != null &&
                  DateTime.now().millisecondsSinceEpoch <
                      expiredTime + 10 * 1000) {
                popNavigate(context);
                _acceptCodePopup(
                  context,
                  sessionId: sessionId,
                  nonce: nonce,
                  expiredTime: expiredTime,
                  appData: appData!,
                );
              }
            } catch (e) {
              _showMessageDialog(
                context,
                title: "Error",
                message: e.toString(),
              );
              // DO NOTHING
            }
          },
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sauth Mobile')),
      body: Center(
        child: ElevatedButton(
          onPressed: () {
            _scan(context);
          },
          child: const Text('Scan'),
        ),
      ),
    );
  }
}
