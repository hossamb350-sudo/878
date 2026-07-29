import 'package:flutter/material.dart';
import 'dart:ui';

class HeaderWidgets extends StatelessWidget {
  const HeaderWidgets({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
      child: Directionality(
        textDirection: TextDirection.rtl,
        child: Row(
          children: [
            Expanded(child: _buildLogoCard()),
            const SizedBox(width: 8),
            Expanded(child: _buildPrayerCard()),
            const SizedBox(width: 8),
            Expanded(child: _buildWeatherCard()),
            const SizedBox(width: 8),
            Expanded(child: _buildDateCard()),
          ],
        ),
      ),
    );
  }

  Widget _buildGlassCard({required Widget child}) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
        child: Container(
          height: 160,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.4),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: Colors.white.withOpacity(0.5), width: 1),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 30,
                offset: const Offset(0, 8),
              )
            ],
          ),
          child: child,
        ),
      ),
    );
  }

  Widget _buildLogoCard() {
    return SizedBox(
      height: 160,
      child: Center(
        child: Image.asset(
          'assets/images/logo.png', // Placeholder
          fit: BoxFit.contain,
        ),
      ),
    );
  }

  Widget _buildPrayerCard() {
    return _buildGlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text('الصلاة القادمة', style: TextStyle(fontSize: 12, color: Colors.green, fontWeight: FontWeight.bold)),
              Icon(Icons.mosque, color: Colors.amber, size: 24),
            ],
          ),
          const Text('الفجر', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.5),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text('02:45:10', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildWeatherCard() {
    return _buildGlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text('24°', style: TextStyle(fontSize: 34, fontWeight: FontWeight.bold)),
              Icon(Icons.cloud, color: Colors.blue, size: 24),
            ],
          ),
          const Text('غائم جزئياً', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          Row(
            children: const [
              Text('▲ 28°', style: TextStyle(fontSize: 12, color: Colors.orange)),
              SizedBox(width: 8),
              Text('▼ 18°', style: TextStyle(fontSize: 12, color: Colors.blue)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDateCard() {
    return _buildGlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text('التقويم الهجري', style: TextStyle(fontSize: 12, color: Colors.green, fontWeight: FontWeight.bold)),
              Icon(Icons.calendar_today, color: Colors.green, size: 24),
            ],
          ),
          const Text('الخميس', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const Text('14 رمضان 1445', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
