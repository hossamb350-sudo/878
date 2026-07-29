import 'package:http/http.dart' as http;
import 'dart:convert';
import 'api_service.dart';

class PushNotificationService {
  static Future<bool> subscribeToNotifications(String endpoint, String p256dh, String auth) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiService.baseUrl}/subscribe-push'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'subscription': {
            'endpoint': endpoint,
            'keys': {
              'p256dh': p256dh,
              'auth': auth,
            }
          }
        }),
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Error subscribing push notifications: $e');
      return false;
    }
  }

  static Future<bool> sendUrgentBroadcast(String title, String body) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiService.baseUrl}/broadcast-urgent'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'title': title, 'body': body}),
      );
      return response.statusCode == 200;
    } catch (e) {
      print('Error sending broadcast: $e');
      return false;
    }
  }
}
