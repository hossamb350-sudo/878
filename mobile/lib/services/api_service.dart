import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // Base URL pointing to local server or backend API endpoint
  static const String baseUrl = 'http://localhost:3000/api';

  static Future<Map<String, dynamic>> fetchWeatherData() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/weather'));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      print('Error fetching weather: $e');
    }
    return {
      'temp': '28°C',
      'condition': 'مشمس',
      'city': 'تعز',
      'icon': '01d'
    };
  }

  static Future<Map<String, dynamic>> fetchPrayerTimes() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/prayer-times'));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      print('Error fetching prayer times: $e');
    }
    return {
      'Fajr': '04:45',
      'Sunrise': '05:58',
      'Dhuhr': '12:12',
      'Asr': '15:30',
      'Maghrib': '18:24',
      'Isha': '19:39',
      'nextPrayer': 'المغرب',
      'timeRemaining': '01:15:00',
    };
  }

  static Future<List<dynamic>> fetchQuranData() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/quran-data'));
      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
    } catch (e) {
      print('Error fetching Quran data: $e');
    }
    return [];
  }

  static Future<String?> generateAiNewspaperAssist({
    required String prompt,
    required String action,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/ai-newspaper-assist'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'prompt': prompt, 'action': action}),
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['result'];
      }
    } catch (e) {
      print('Error with AI Newspaper Assist: $e');
    }
    return null;
  }
}
