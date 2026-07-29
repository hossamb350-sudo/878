import 'package:flutter/material.dart';

class WeatherPrayerHeader extends StatelessWidget {
  const WeatherPrayerHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.teal.shade700, Colors.teal.shade900],
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.teal.withOpacity(0.2),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.location_on, color: Colors.amber, size: 20),
                  const SizedBox(width: 4),
                  const Text(
                    'تعز، اليمن',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  const Icon(Icons.wb_sunny, color: Colors.amber, size: 22),
                  const SizedBox(width: 6),
                  const Text(
                    '28°C مشمس',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 10),
            child: Divider(color: Colors.white24, height: 1),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildPrayerTime('الفجر', '04:45'),
              _buildPrayerTime('الظهر', '12:12'),
              _buildPrayerTime('العصر', '15:30'),
              _buildPrayerTime('المغرب', '18:24', isNext: true),
              _buildPrayerTime('العشاء', '19:39'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPrayerTime(String name, String time, {bool isNext = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: isNext ? Colors.amber.withOpacity(0.25) : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
        border: isNext ? Border.all(color: Colors.amber, width: 1) : null,
      ),
      child: Column(
        children: [
          Text(
            name,
            style: TextStyle(
              color: isNext ? Colors.amber : Colors.white70,
              fontSize: 12,
              fontWeight: isNext ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            time,
            style: TextStyle(
              color: Colors.white,
              fontSize: 13,
              fontWeight: isNext ? FontWeight.bold : FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
