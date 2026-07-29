import 'package:flutter/material.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const TaizPlatformApp());
}

class TaizPlatformApp extends StatelessWidget {
  const TaizPlatformApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'منصة تعز',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        fontFamily: 'Tajawal',
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF50C878)),
      ),
      home: const HomeScreen(),
    );
  }
}
