import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('إعدادات التطبيق'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'المظهر والخطوط',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.teal),
          ),
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  secondary: const Icon(Icons.dark_mode),
                  title: const Text('الوضع الداكن'),
                  subtitle: const Text('تفعيل ألوان المظهر الليلي'),
                  value: themeProvider.isDarkMode,
                  onChanged: (val) {
                    themeProvider.toggleTheme(val);
                  },
                ),
                const Divider(height: 1),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('حجم الخط في المقالات:'),
                          Text('${themeProvider.fontSize.toInt()}px', style: const TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                      Slider(
                        value: themeProvider.fontSize,
                        min: 14,
                        max: 26,
                        divisions: 6,
                        activeColor: Colors.teal,
                        onChanged: (val) {
                          themeProvider.setFontSize(val);
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'الإشعارات والتنبيهات',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.teal),
          ),
          Card(
            child: Column(
              children: [
                SwitchListTile(
                  secondary: const Icon(Icons.bolt, color: Colors.red),
                  title: const Text('إشعارات الأخبار العاجلة'),
                  value: true,
                  onChanged: (val) {},
                ),
                const Divider(height: 1),
                SwitchListTile(
                  secondary: const Icon(Icons.access_time),
                  title: const Text('تنبيهات مواقيت الصلاة'),
                  value: true,
                  onChanged: (val) {},
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'عن المنصة',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.teal),
          ),
          const Card(
            child: ListTile(
              leading: Icon(Icons.info_outline, color: Colors.teal),
              title: Text('منصة تعز الإعلامية'),
              subtitle: Text('الإصدار 1.0.0 (Flutter Native Build)'),
            ),
          ),
        ],
      ),
    );
  }
}
