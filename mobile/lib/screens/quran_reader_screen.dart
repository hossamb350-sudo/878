import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/quran_models.dart';
import '../providers/quran_provider.dart';

class QuranReaderScreen extends StatelessWidget {
  final QuranLesson lesson;

  const QuranReaderScreen({super.key, required this.lesson});

  @override
  Widget build(BuildContext context) {
    final quranProvider = Provider.of<QuranProvider>(context);
    final isPlaying = quranProvider.isPlaying && quranProvider.currentlyPlayingAudioUrl == lesson.audioUrl;

    return Scaffold(
      appBar: AppBar(
        title: Text(lesson.title),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            if (lesson.audioUrl != null)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.teal.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    IconButton(
                      icon: Icon(isPlaying ? Icons.pause_circle_filled : Icons.play_circle_fill, size: 40, color: Colors.teal.shade800),
                      onPressed: () {
                        if (isPlaying) {
                          quranProvider.pauseAudio();
                        } else {
                          quranProvider.playAudio(lesson.audioUrl!, lesson.title);
                        }
                      },
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAlignment.start,
                        children: [
                          Text(
                            lesson.title,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          Text(
                            lesson.readerName ?? 'تشغيل التلاوة الصوتية',
                            style: const TextStyle(fontSize: 12, color: Colors.black60),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 20),
            Expanded(
              child: SingleChildScrollView(
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.amber.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.amber.shade200),
                  ),
                  child: Text(
                    lesson.content ?? 'لا يوجد نص مكتوب متاح',
                    style: const TextStyle(
                      fontSize: 20,
                      height: 2.0,
                      fontFamily: 'Tajawal',
                      fontWeight: FontWeight.w500,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
