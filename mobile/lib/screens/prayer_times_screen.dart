import 'package:flutter/material.dart';

class PrayerTimesScreen extends StatelessWidget {
  const PrayerTimesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('مواقيت الصلاة والتقويم الهجري'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.teal.shade800, Colors.teal.shade500],
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Column(
                children: [
                  Text(
                    'مدينة تعز - اليمن',
                    style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 6),
                  Text(
                    'الأربعاء، 12 صفر 1448 هـ',
                    style: TextStyle(color: Colors.amber, fontSize: 16, fontWeight: FontWeight.w600),
                  ),
                  SizedBox(height: 16),
                  Text(
                    'الصلاة القادمة: المغرب',
                    style: TextStyle(color: Colors.white, fontSize: 15),
                  ),
                  Text(
                    '01:15:00 متبقية',
                    style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Card(
              elevation: 3,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: Column(
                children: [
                  _buildPrayerTile('الفجر', '04:45 ص', false),
                  const Divider(height: 1),
                  _buildPrayerTile('الشروق', '05:58 ص', false),
                  const Divider(height: 1),
                  _buildPrayerTile('الظهر', '12:12 م', false),
                  const Divider(height: 1),
                  _buildPrayerTile('العصر', '03:30 م', false),
                  const Divider(height: 1),
                  _buildPrayerTile('المغرب', '06:24 م', true),
                  const Divider(height: 1),
                  _buildPrayerTile('العشاء', '07:39 م', false),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPrayerTile(String name, String time, bool isCurrent) {
    return Container(
      color: isCurrent ? Colors.teal.shade50 : Colors.transparent,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(
                Icons.access_time_filled,
                color: isCurrent ? Colors.teal : Colors.grey,
                size: 20,
              ),
              const SizedBox(width: 12),
              Text(
                name,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                  color: isCurrent ? Colors.teal.shade900 : Colors.black87,
                ),
              ),
            ],
          ),
          Text(
            time,
            style: TextStyle(
              fontSize: 16,
              fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
              color: isCurrent ? Colors.teal.shade900 : Colors.black87,
            ),
          ),
        ],
      ),
    );
  }
}
