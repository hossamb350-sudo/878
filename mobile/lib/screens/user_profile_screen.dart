import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import 'admin/admin_dashboard_screen.dart';

class UserProfileScreen extends StatelessWidget {
  const UserProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('الملف الشخصي'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const CircleAvatar(
              radius: 45,
              backgroundColor: Colors.teal,
              child: Icon(Icons.person, size: 50, color: Colors.white),
            ),
            const SizedBox(height: 12),
            const Text(
              'حسام الإبراهيمي',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const Text(
              'مدير المنصة',
              style: TextStyle(color: Colors.teal, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 20),
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: const Icon(Icons.admin_panel_settings, color: Colors.teal),
                    title: const Text('لوحة الإدارة والمحرر'),
                    subtitle: const Text('إدارة الأخبار، الشريط العاجل، والدروس'),
                    trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const AdminDashboardScreen(),
                        ),
                      );
                    },
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.bookmark, color: Colors.teal),
                    title: const Text('الأخبار المحفوظة'),
                    trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                    onTap: () {},
                  ),
                  const Divider(height: 1),
                  SwitchListTile(
                    secondary: const Icon(Icons.dark_mode, color: Colors.teal),
                    title: const Text('الوضع الليلي'),
                    value: themeProvider.isDarkMode,
                    onChanged: (val) {
                      themeProvider.toggleTheme(val);
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
