import 'package:flutter/material.dart';
import 'admin_news_wizard_screen.dart';

class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('لوحة الإدارة الرئيسية'),
        backgroundColor: Colors.teal.shade800,
        foregroundColor: Colors.white,
      ),
      body: GridView.count(
        padding: const EdgeInsets.all(16),
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        children: [
          _buildAdminCard(
            context,
            icon: Icons.article,
            title: 'إضافة خبر جديد',
            color: Colors.blue,
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const AdminNewsWizardScreen(),
                ),
              );
            },
          ),
          _buildAdminCard(
            context,
            icon: Icons.bolt,
            title: 'إدارة الشريط العاجل',
            color: Colors.red,
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('شاشة إدارة الشريط العاجل جاهزة')),
              );
            },
          ),
          _buildAdminCard(
            context,
            icon: Icons.menu_book,
            title: 'إدارة دروس القرآن',
            color: Colors.amber.shade800,
            onTap: () {},
          ),
          _buildAdminCard(
            context,
            icon: Icons.people,
            title: 'إدارة المستخدمين',
            color: Colors.purple,
            onTap: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildAdminCard(BuildContext context, {required IconData icon, required String title, required Color color, required VoidCallback onTap}) {
    return Card(
      elevation: 3,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: color.withOpacity(0.15),
              child: Icon(icon, color: color, size: 30),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
