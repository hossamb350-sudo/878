import 'package:flutter/material.dart';
import 'dart:ui';
import 'animated_card_backgrounds.dart';

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

  Widget _buildGlassCard({required Widget child, Widget? background}) {
    return Container(
      height: 160,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 30,
            offset: const Offset(0, 8),
          )
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(22),
        child: Stack(
          fit: StackFit.expand,
          children: [
            if (background != null) background,
            if (background != null)
              Container(color: Colors.black.withOpacity(0.3)), // Contrast overlay
            BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: background != null ? Colors.white.withOpacity(0.1) : Colors.white.withOpacity(0.4),
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: Colors.white.withOpacity(0.5), width: 1),
                ),
                child: child,
              ),
            ),
          ],
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
      background: const PrayerAnimatedBackground(prayerName: 'الفجر'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text('الصلاة القادمة', style: TextStyle(fontSize: 12, color: Colors.white70, fontWeight: FontWeight.bold)),
              Icon(Icons.mosque, color: Colors.amber, size: 24),
            ],
          ),
          const Text('الفجر', style: TextStyle(fontSize: 22, color: Colors.white, fontWeight: FontWeight.bold)),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.3),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text('02:45:10', style: TextStyle(fontSize: 14, color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildWeatherCard() {
    return _buildGlassCard(
      background: const WeatherAnimatedBackground(weatherCode: 2), // Example: partly cloudy
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text('24°', style: TextStyle(fontSize: 34, color: Colors.white, fontWeight: FontWeight.bold)),
              Icon(Icons.cloud, color: Colors.white, size: 24),
            ],
          ),
          const Text('غائم جزئياً', style: TextStyle(fontSize: 14, color: Colors.white, fontWeight: FontWeight.bold)),
          Row(
            children: const [
              Text('▲ 28°', style: TextStyle(fontSize: 12, color: Colors.orangeAccent)),
              SizedBox(width: 8),
              Text('▼ 18°', style: TextStyle(fontSize: 12, color: Colors.lightBlueAccent)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDateCard() {
    return _buildGlassCard(
      background: const HijriAnimatedBackground(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text('التقويم الهجري', style: TextStyle(fontSize: 12, color: Colors.amberAccent, fontWeight: FontWeight.bold)),
              Icon(Icons.calendar_today, color: Colors.amber, size: 24),
            ],
          ),
          const Text('الخميس', style: TextStyle(fontSize: 22, color: Colors.white, fontWeight: FontWeight.bold)),
          const Text('14 رمضان 1445', style: TextStyle(fontSize: 14, color: Colors.white, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
