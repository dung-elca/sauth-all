import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class QrcodeScanner extends StatelessWidget {
  final Function(String code) onCodeDetected;
  final VoidCallback onCanceled;

  const QrcodeScanner({
    super.key,
    required this.onCodeDetected,
    required this.onCanceled,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan QR Code'),
        actions: [
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () {
              onCanceled();
            },
          ),
        ],
      ),
      body: MobileScanner(
        onDetect: (barcodes) async {
          final code = barcodes.barcodes.firstOrNull?.rawValue;
          if (code != null && code.isNotEmpty) {
            onCodeDetected(code);
          }
        },
      ),
    );
  }
}
