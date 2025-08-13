import 'dart:convert';

import 'package:mobile/app_data.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppStorage {
  static const String _appDataKey = 'app_data';
  static const String _clientIdKey = 'client_id';

  // Save app data to SharedPreferences
  Future<void> saveAppData(AppData data) async {
    final prefs = await SharedPreferences.getInstance();
    final jsonData = jsonEncode(data.toJson());
    await prefs.setString(_appDataKey, jsonData);
  }

  // Retrieve app data from SharedPreferences
  Future<AppData?> getAppData() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_appDataKey);
    if (data != null) {
      final jsonData = Map<String, dynamic>.from(jsonDecode(data));
      return AppData.fromJson(jsonData);
    } else {
      return null;
    }
  }

  // Save client ID to SharedPreferences
  Future<void> saveClientId(String clientId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_clientIdKey, clientId);
  }

  // Retrieve client ID from SharedPreferences
  Future<String> getClientId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_clientIdKey) ??
        '20jwYgZbdicbXbiT8BsyDgmYttVu6uQVIbBhXUQpySfOKj4vG4tOhd7DAC9I6bQ2';
  }

  // Clear app data from SharedPreferences
  Future<void> clearAppData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_appDataKey);
  }
}

var appStorage = AppStorage();
