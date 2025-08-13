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

class MyHomePage extends StatefulWidget {
  const MyHomePage({super.key});

  @override
  State<MyHomePage> createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {
  Future<AppData> _registerDevice() async {
    final keyPair = await ed25519Util.generateKeyPair();
    final deviceUUID = await getDeviceUUID();
    final clientId = await appStorage.getClientId();
    if (deviceUUID == null) {
      throw Exception('Failed to get device UUID');
    }
    final timestamp = DateTime.now().microsecondsSinceEpoch;
    final signature = await ed25519Util.sign(
      "$deviceUUID:$timestamp:${keyPair.publicKey}:$clientId",
      keyPair.privateKey,
    );
    final deviceId = await apiClient.registerDevice(
      keyPair.publicKey,
      signature,
      deviceUUID,
      timestamp,
      clientId,
      (Widget widget) {
        showGeneralDialog(
          context: context,
          barrierDismissible: false,
          pageBuilder: (context, __, ___) {
            return widget;
          },
        );
      },
      () {
        Navigator.pop(context);
      },
    );
    final appData = AppData(privateKey: keyPair.privateKey, deviceId: deviceId);
    await appStorage.saveAppData(appData);
    return appData;
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

  void _acceptCodePopup({
    required String sessionId,
    required String nonce,
    required int expiredTime,
    required AppData appData,
  }) async {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('A QRcode Detected'),
          content: const Text('Would you like to accept this qrcode?'),
          actions: [
            TextButton(
              onPressed: () {
                _acceptCode(
                  sessionId: sessionId,
                  nonce: nonce,
                  expiredTime: expiredTime,
                  appData: appData,
                );
                popNavigate(context);
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

  void _acceptCode({
    required String sessionId,
    required String nonce,
    required int expiredTime,
    required AppData appData,
  }) async {
    final timestamp = DateTime.now().microsecondsSinceEpoch;
    final deviceId = appData.deviceId;
    final clientId = await appStorage.getClientId();
    final signature = await ed25519Util.sign(
      "$sessionId:$nonce:$deviceId:$expiredTime:$timestamp:$clientId",
      appData.privateKey,
    );
    try {
      final status = await apiClient.verifyQrCode(
        sessionId,
        nonce,
        signature,
        deviceId,
        timestamp,
        clientId,
        (Widget widget) {
          showGeneralDialog(
            context: context,
            barrierDismissible: false,
            pageBuilder: (context, __, ___) {
              return widget;
            },
          );
        },
        () {
          Navigator.pop(context);
        },
      );
      if (mounted) {
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
      if (mounted) {
        _showMessageDialog(context, title: "Error", message: e.toString());
      }
    }
  }

  void _scan() async {
    try {
      var appData = await appStorage.getAppData();
      if (!mounted) return;
      appData ??= await _registerDevice();
      if (!mounted) return;
      presentNavigate(
        context,
        QrcodeScanner(
          onCanceled: () {
            popNavigate(context);
          },
          onCodeDetected: (code) {
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
                  sessionId: sessionId,
                  nonce: nonce,
                  expiredTime: expiredTime,
                  appData: appData!,
                );
              }
            } catch (e) {
              // DO NOTHING
            }
          },
        ),
      );
    } catch (e) {
      if (mounted) {
        _showMessageDialog(context, title: "Error", message: e.toString());
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFF7FDBFF), // light blue
              Color(0xFF0074D9), // dark blue
            ],
          ),
        ),
        child: Center(
          child: Column(
            spacing: 24,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Image.asset('assets/logo.png', width: 160, height: 160),
              ElevatedButton(
                onPressed: () => _scan(),
                child: Text('Scan QR Code'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
