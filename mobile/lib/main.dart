import 'package:flutter/material.dart';
import 'package:mobile/api_client.dart';
import 'package:mobile/app_data.dart';
import 'package:mobile/app_storage.dart';
import 'package:mobile/device_util.dart';
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
    final deviceInfo = await getDeviceUUID();
    if (deviceInfo == null) {
      throw Exception('Failed to get device UUID');
    }
    final timestamp = DateTime.now().microsecondsSinceEpoch;
    final signature = await ed25519Util.sign(
      "$deviceInfo:$timestamp:${keyPair.publicKey}",
      keyPair.privateKey,
    );
    final deviceId = await apiClient.registerDevice(
      keyPair.publicKey,
      signature,
      deviceInfo,
      timestamp,
    );
    await appStorage.saveAppData(
      AppData(privateKey: keyPair.privateKey, deviceId: deviceId),
    );
  }

  Future<void> _verifyQrCode() async {}

  void _scan() async {
    final appData = await appStorage.getAppData();
    await _registerDevice();
    await _verifyQrCode();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sauth Mobile')),
      body: Center(
        child: ElevatedButton(
          onPressed: () {
            _scan();
          },
          child: const Text('Scan'),
        ),
      ),
    );
  }
}
