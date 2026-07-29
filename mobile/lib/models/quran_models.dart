class QuranSeries {
  final String id;
  final String title;
  final String? description;
  final String? imageUrl;
  final int order;
  final int? verseCount;
  final String? type;
  final int createdAt;

  QuranSeries({
    required this.id,
    required this.title,
    this.description,
    this.imageUrl,
    required this.order,
    this.verseCount,
    this.type,
    required this.createdAt,
  });

  factory QuranSeries.fromJson(Map<String, dynamic> json, {String? docId}) {
    return QuranSeries(
      id: docId ?? json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      imageUrl: json['imageUrl'],
      order: json['order'] ?? 0,
      verseCount: json['verseCount'],
      type: json['type'],
      createdAt: json['createdAt'] ?? DateTime.now().millisecondsSinceEpoch,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'imageUrl': imageUrl,
        'order': order,
        'verseCount': verseCount,
        'type': type,
        'createdAt': createdAt,
      };
}

class QuranLesson {
  final String id;
  final String seriesId;
  final String title;
  final String? content;
  final String? audioUrl;
  final int order;
  final String? readerName;
  final int durationSeconds;

  QuranLesson({
    required this.id,
    required this.seriesId,
    required this.title,
    this.content,
    this.audioUrl,
    required this.order,
    this.readerName,
    this.durationSeconds = 0,
  });

  factory QuranLesson.fromJson(Map<String, dynamic> json, {String? docId}) {
    return QuranLesson(
      id: docId ?? json['id'] ?? '',
      seriesId: json['seriesId'] ?? '',
      title: json['title'] ?? '',
      content: json['content'],
      audioUrl: json['audioUrl'],
      order: json['order'] ?? 0,
      readerName: json['readerName'],
      durationSeconds: json['durationSeconds'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'seriesId': seriesId,
        'title': title,
        'content': content,
        'audioUrl': audioUrl,
        'order': order,
        'readerName': readerName,
        'durationSeconds': durationSeconds,
      };
}

class QuranSurah {
  final int number;
  final String name;
  final String englishName;
  final int numberOfAyahs;
  final String revelationType;

  QuranSurah({
    required this.number,
    required this.name,
    required this.englishName,
    required this.numberOfAyahs,
    required this.revelationType,
  });

  factory QuranSurah.fromJson(Map<String, dynamic> json) {
    return QuranSurah(
      number: json['number'] ?? 1,
      name: json['name'] ?? '',
      englishName: json['englishName'] ?? '',
      numberOfAyahs: json['numberOfAyahs'] ?? 0,
      revelationType: json['revelationType'] ?? 'Meccan',
    );
  }
}
