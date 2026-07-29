import 'package:flutter/material.dart';
import '../models/quran_models.dart';

class QuranProvider with ChangeNotifier {
  List<QuranSeries> _seriesList = [];
  List<QuranLesson> _lessonsList = [];
  String? _currentlyPlayingAudioUrl;
  String? _currentlyPlayingTitle;
  bool _isPlaying = false;

  List<QuranSeries> get seriesList => _seriesList;
  List<QuranLesson> get lessonsList => _lessonsList;
  String? get currentlyPlayingAudioUrl => _currentlyPlayingAudioUrl;
  String? get currentlyPlayingTitle => _currentlyPlayingTitle;
  bool get isPlaying => _isPlaying;

  void loadSampleQuranData() {
    _seriesList = [
      QuranSeries(
        id: 's1',
        title: 'تلاوات خاشعة من المسجد الكبير بتعز',
        description: 'مجموعة من التلاوات المتميزة للقراء الشباب في محافظة تعز',
        order: 1,
        verseCount: 114,
        type: 'audio',
        createdAt: DateTime.now().millisecondsSinceEpoch,
      ),
      QuranSeries(
        id: 's2',
        title: 'سلسلة تدبر القرآن الكريم',
        description: 'دروس تفسيرية وتدبر لآيات الحكيم الخبير',
        order: 2,
        verseCount: 30,
        type: 'lessons',
        createdAt: DateTime.now().millisecondsSinceEpoch,
      )
    ];

    _lessonsList = [
      QuranLesson(
        id: 'l1',
        seriesId: 's1',
        title: 'سورة الفاتحة والبقرة (تلاوة مباركة)',
        content: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ. الرَّحْمَنِ الرَّحِيمِ. مَالِكِ يَوْمِ الدِّينِ...',
        audioUrl: 'https://server8.mp3quran.net/afs/001.mp3',
        order: 1,
        readerName: 'الشيخ مشاري العفاسي',
      ),
      QuranLesson(
        id: 'l2',
        seriesId: 's1',
        title: 'سورة يس (تلاوة خاشعة)',
        content: 'يس. وَالْقُرْآنِ الْحَكِيمِ. إِنَّكَ لَمِنَ الْمُرْسَلِينَ. عَلَى صِرَاطٍ مُسْتَقِيمٍ...',
        audioUrl: 'https://server8.mp3quran.net/afs/036.mp3',
        order: 2,
        readerName: 'الشيخ مشاري العفاسي',
      ),
    ];
    notifyListeners();
  }

  void playAudio(String url, String title) {
    _currentlyPlayingAudioUrl = url;
    _currentlyPlayingTitle = title;
    _isPlaying = true;
    notifyListeners();
  }

  void pauseAudio() {
    _isPlaying = false;
    notifyListeners();
  }

  void resumeAudio() {
    if (_currentlyPlayingAudioUrl != null) {
      _isPlaying = true;
      notifyListeners();
    }
  }

  void stopAudio() {
    _currentlyPlayingAudioUrl = null;
    _currentlyPlayingTitle = null;
    _isPlaying = false;
    notifyListeners();
  }
}
