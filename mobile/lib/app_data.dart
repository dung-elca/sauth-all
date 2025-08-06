class AppData {
  final String privateKey;
  final String deviceId;

  AppData({required this.privateKey, required this.deviceId});

  Map<String, dynamic> toJson() {
    return {'privateKey': privateKey, 'deviceId': deviceId};
  }

  factory AppData.fromJson(Map<String, dynamic> json) {
    return AppData(privateKey: json['privateKey'], deviceId: json['deviceId']);
  }
}
