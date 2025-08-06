import 'package:shared_preferences/shared_preferences.dart';

class AppStorage {
  static const String _appDataKey = 'app_data';

  // Save app data to SharedPreferences
  Future<void> saveAppData(String data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_appDataKey, data);
  }

  // Retrieve app data from SharedPreferences
  Future<String?> getAppData() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_appDataKey);
  }

  // Clear app data from SharedPreferences
  Future<void> clearAppData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_appDataKey);
  }
}

var appStorage = AppStorage();
