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
      body: Stack(
        children: [
          MobileScanner(
            onDetect: (barcodes) async {
              final code = barcodes.barcodes.firstOrNull?.rawValue;
              if (code != null && code.isNotEmpty) {
                onCodeDetected(code);
              }
            },
          ),
          Positioned(
            top: 16,
            left: 8,
            child: IconButton(
              icon: const Icon(Icons.close, color: Colors.white, size: 40),
              onPressed: onCanceled,
              tooltip: 'Close',
            ),
          ),
        ],
      ),
    );
  }
}
