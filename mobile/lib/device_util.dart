import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

Future<String?> getDeviceUUID() async {
  final secureStorage = FlutterSecureStorage();
  var uuid = await secureStorage.read(key: 'device_uuid');
  if (uuid != null) {
    return uuid;
  }
  final deviceInfo = DeviceInfoPlugin();
  if (Platform.isAndroid) {
    final androidInfo = await deviceInfo.androidInfo;
    uuid = androidInfo.id;
  } else if (Platform.isIOS) {
    final iosInfo = await deviceInfo.iosInfo;
    uuid = iosInfo.identifierForVendor;
  }
  await secureStorage.write(key: 'device_uuid', value: uuid);
  return uuid;
}
