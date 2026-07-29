import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/quran_provider.dart';
import 'quran_reader_screen.dart';

class QuranKareemScreen extends StatefulWidget {
  const QuranKareemScreen({super.key});

  @override
  State<QuranKareemScreen> createState() => _QuranKareemScreenState();
}

class _QuranKareemScreenState extends State<QuranKareemScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      Provider.of<QuranProvider>(context, listen: false).loadSampleQuranData();
    });
  }

  @override
  Widget build(BuildContext context) {
    final quranProvider = Provider.of<QuranProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('القرآن الكريم والتلاوات'),
        backgroundColor: Colors.teal,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.teal.shade50,
            child: Row(
              children: [
                const Icon(Icons.menu_book, color: Colors.teal, size: 36),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAlignment.start,
                    children: [
                      Text(
                        'قسم القرآن والدروس القرآنية',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      Text(
                        'استمع للتلاوات الخاشعة وتابع دروس تدبر القرآن الكريم',
                        style: TextStyle(fontSize: 12, color: Colors.black54),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              itemCount: quranProvider.lessonsList.length,
              itemBuilder: (context, index) {
                final lesson = quranProvider.lessonsList[index];
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: ListTile(
                    leading: const CircleAvatar(
                      backgroundColor: Colors.teal,
                      child: Icon(Icons.play_arrow, color: Colors.white),
                    ),
                    title: Text(
                      lesson.title,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Text(lesson.readerName ?? 'القارئ'),
                    trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => QuranReaderScreen(lesson: lesson),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
