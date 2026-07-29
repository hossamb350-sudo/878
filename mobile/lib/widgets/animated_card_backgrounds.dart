import 'package:flutter/material.dart';
import 'dart:math';

// --- Shared Particle System ---
class ParticleSystem extends StatefulWidget {
  final Color color;
  final int count;
  final String direction;

  const ParticleSystem({
    super.key,
    this.color = Colors.white54,
    this.count = 15,
    this.direction = 'up',
  });

  @override
  State<ParticleSystem> createState() => _ParticleSystemState();
}

class _ParticleSystemState extends State<ParticleSystem> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late List<Particle> _particles;
  final Random _rnd = Random();

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 10))..repeat();
    _particles = List.generate(widget.count, (index) => _generateParticle());
  }

  Particle _generateParticle() {
    return Particle(
      x: _rnd.nextDouble(),
      y: widget.direction == 'down' ? -_rnd.nextDouble() : _rnd.nextDouble(),
      speed: _rnd.nextDouble() * 0.5 + 0.2,
      size: _rnd.nextDouble() * 3 + 1,
      phase: _rnd.nextDouble() * 2 * pi,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          painter: ParticlePainter(
            particles: _particles,
            progress: _controller.value,
            color: widget.color,
            direction: widget.direction,
          ),
          child: Container(),
        );
      },
    );
  }
}

class Particle {
  final double x;
  final double y;
  final double speed;
  final double size;
  final double phase;

  Particle({required this.x, required this.y, required this.speed, required this.size, required this.phase});
}

class ParticlePainter extends CustomPainter {
  final List<Particle> particles;
  final double progress;
  final Color color;
  final String direction;

  ParticlePainter({required this.particles, required this.progress, required this.color, required this.direction});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;
    
    for (var p in particles) {
      double currentY;
      double currentX = p.x * size.width + sin(progress * 2 * pi + p.phase) * 10;
      
      if (direction == 'down') {
        currentY = (p.y + (progress * p.speed * 2)) % 1.0 * size.height;
      } else if (direction == 'diagonal') {
        currentY = (p.y + (progress * p.speed * 2)) % 1.0 * size.height;
        currentX = (p.x + (progress * p.speed * 2)) % 1.0 * size.width;
      } else {
        currentY = size.height - ((p.y + (progress * p.speed * 2)) % 1.0 * size.height);
      }
      
      paint.color = color.withOpacity((sin(progress * 2 * pi + p.phase) + 1.5) / 2.5 * color.opacity);
      canvas.drawCircle(Offset(currentX, currentY), p.size, paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

// --- Prayer Background ---
class PrayerAnimatedBackground extends StatefulWidget {
  final String prayerName;
  const PrayerAnimatedBackground({super.key, required this.prayerName});

  @override
  State<PrayerAnimatedBackground> createState() => _PrayerAnimatedBackgroundState();
}

class _PrayerAnimatedBackgroundState extends State<PrayerAnimatedBackground> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 15))..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    List<Color> colors;
    Color particleColor;
    
    switch (widget.prayerName) {
      case 'الفجر':
        colors = [const Color(0xFF1a2b4c), const Color(0xFF4a6b8c), const Color(0xFFe6cfcf)];
        particleColor = Colors.white.withOpacity(0.4);
        break;
      case 'الظهر':
        colors = [const Color(0xFF4ea5d9), const Color(0xFF86c6ea), const Color(0xFFd6eaf8)];
        particleColor = Colors.white.withOpacity(0.6);
        break;
      case 'العصر':
        colors = [const Color(0xFFe69831), const Color(0xFFf3c258), const Color(0xFFf9e5a1)];
        particleColor = Colors.white.withOpacity(0.6);
        break;
      case 'المغرب':
        colors = [const Color(0xFF2b1055), const Color(0xFF75225b), const Color(0xFFd76d41)];
        particleColor = Colors.white.withOpacity(0.5);
        break;
      case 'العشاء':
        colors = [const Color(0xFF0b1021), const Color(0xFF1b274c), const Color(0xFF2a3b63)];
        particleColor = Colors.white.withOpacity(0.7);
        break;
      default:
        colors = [const Color(0xFF4ea5d9), const Color(0xFF86c6ea), const Color(0xFFd6eaf8)];
        particleColor = Colors.white.withOpacity(0.6);
    }

    return Stack(
      children: [
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: colors,
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return Transform.scale(
              scale: 1.0 + (_controller.value * 0.1),
              child: Opacity(
                opacity: 0.3 + (_controller.value * 0.3),
                child: Container(
                  decoration: BoxDecoration(
                    gradient: RadialGradient(
                      colors: [Colors.white.withOpacity(0.5), Colors.transparent],
                      center: const Alignment(0, 0.5),
                      radius: 1.5,
                    ),
                  ),
                ),
              ),
            );
          },
        ),
        ParticleSystem(color: particleColor, direction: widget.prayerName == 'العصر' ? 'diagonal' : 'up'),
      ],
    );
  }
}

// --- Weather Background ---
class WeatherAnimatedBackground extends StatefulWidget {
  final int weatherCode;
  final bool isNight;
  const WeatherAnimatedBackground({super.key, required this.weatherCode, this.isNight = false});

  @override
  State<WeatherAnimatedBackground> createState() => _WeatherAnimatedBackgroundState();
}

class _WeatherAnimatedBackgroundState extends State<WeatherAnimatedBackground> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 12))..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    List<Color> colors;
    Color particleColor;
    String direction = 'up';
    int particleCount = 15;
    
    // Simple mapping based on WMO codes
    if (widget.weatherCode == 0) { // Clear
      colors = widget.isNight 
          ? [const Color(0xFF0f2027), const Color(0xFF203a43), const Color(0xFF2c5364)]
          : [const Color(0xFF4facfe), const Color(0xFF00f2fe)];
      particleColor = Colors.white.withOpacity(0.5);
    } else if (widget.weatherCode <= 3) { // Cloudy
      colors = [const Color(0xFF757f9a), const Color(0xFFd7dde8)];
      particleColor = Colors.white.withOpacity(0.2);
      direction = 'diagonal';
      particleCount = 10;
    } else if (widget.weatherCode <= 67 || (widget.weatherCode >= 80 && widget.weatherCode <= 82)) { // Rain
      colors = [const Color(0xFF2b5876), const Color(0xFF4e4376)];
      particleColor = Colors.white.withOpacity(0.4);
      direction = 'down';
      particleCount = 40;
    } else if (widget.weatherCode <= 77 || widget.weatherCode == 85 || widget.weatherCode == 86) { // Snow
      colors = [const Color(0xFFe0eafc), const Color(0xFFcfdef3)];
      particleColor = Colors.white.withOpacity(0.8);
      direction = 'down';
      particleCount = 50;
    } else if (widget.weatherCode >= 95) { // Thunderstorm
      colors = [const Color(0xFF141e30), const Color(0xFF243b55)];
      particleColor = Colors.white.withOpacity(0.5);
      direction = 'down';
      particleCount = 50;
    } else { // Fallback
      colors = [const Color(0xFF4facfe), const Color(0xFF00f2fe)];
      particleColor = Colors.white.withOpacity(0.5);
    }

    return Stack(
      children: [
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: colors,
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        if (widget.weatherCode >= 95) // Lightning effect
          AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              final val = _controller.value;
              final opacity = (val > 0.4 && val < 0.45) || (val > 0.7 && val < 0.75) ? 0.6 : 0.0;
              return Container(color: Colors.white.withOpacity(opacity));
            },
          ),
        ParticleSystem(color: particleColor, direction: direction, count: particleCount),
      ],
    );
  }
}

// --- Hijri Background ---
class HijriAnimatedBackground extends StatefulWidget {
  const HijriAnimatedBackground({super.key});

  @override
  State<HijriAnimatedBackground> createState() => _HijriAnimatedBackgroundState();
}

class _HijriAnimatedBackgroundState extends State<HijriAnimatedBackground> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 15))..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF0f2027), Color(0xFF203a43), Color(0xFF2c5364)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return Opacity(
              opacity: 0.2 + (_controller.value * 0.2),
              child: Container(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    colors: [const Color(0xFFD4AF37).withOpacity(0.3), Colors.transparent],
                    center: const Alignment(-0.5, -0.5),
                    radius: 1.5,
                  ),
                ),
              ),
            );
          },
        ),
        ParticleSystem(color: const Color(0xFFD4AF37).withOpacity(0.6), count: 20),
      ],
    );
  }
}
