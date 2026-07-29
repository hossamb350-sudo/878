class LiveUpdate {
  final String id;
  final String text;
  final String time;
  final String? imageUrl;
  final String? imageTitle;
  final int? timestamp;

  LiveUpdate({
    required this.id,
    required this.text,
    required this.time,
    this.imageUrl,
    this.imageTitle,
    this.timestamp,
  });

  factory LiveUpdate.fromJson(Map<String, dynamic> json) {
    return LiveUpdate(
      id: json['id'] ?? '',
      text: json['text'] ?? '',
      time: json['time'] ?? '',
      imageUrl: json['imageUrl'],
      imageTitle: json['imageTitle'],
      timestamp: json['timestamp'],
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'text': text,
        'time': time,
        'imageUrl': imageUrl,
        'imageTitle': imageTitle,
        'timestamp': timestamp,
      };
}

class NewsItem {
  final String id;
  final String title;
  final String? shortDescription;
  final String content;
  final String? imageUrl;
  final List<String> additionalImages;
  final String category;
  final List<String> categories;
  final bool isBreaking;
  final bool isPinned;
  final bool isFeaturedLayout;
  final int createdAt;
  final int? updatedAt;
  final String? author;
  final int views;
  final List<LiveUpdate> liveUpdates;
  final List<String> tags;
  final String? videoUrl;
  final bool isLeader;

  NewsItem({
    required this.id,
    required this.title,
    this.shortDescription,
    required this.content,
    this.imageUrl,
    this.additionalImages = const [],
    required this.category,
    this.categories = const [],
    this.isBreaking = false,
    this.isPinned = false,
    this.isFeaturedLayout = false,
    required this.createdAt,
    this.updatedAt,
    this.author,
    this.views = 0,
    this.liveUpdates = const [],
    this.tags = const [],
    this.videoUrl,
    this.isLeader = false,
  });

  factory NewsItem.fromJson(Map<String, dynamic> json, {String? docId}) {
    return NewsItem(
      id: docId ?? json['id'] ?? '',
      title: json['title'] ?? '',
      shortDescription: json['shortDescription'],
      content: json['content'] ?? '',
      imageUrl: json['imageUrl'],
      additionalImages: List<String>.from(json['additionalImages'] ?? []),
      category: json['category'] ?? 'اخبار محلية',
      categories: List<String>.from(json['categories'] ?? []),
      isBreaking: json['isBreaking'] ?? false,
      isPinned: json['isPinned'] ?? false,
      isFeaturedLayout: json['isFeaturedLayout'] ?? false,
      createdAt: json['createdAt'] is int ? json['createdAt'] : (json['createdAt']?.millisecondsSinceEpoch ?? DateTime.now().millisecondsSinceEpoch),
      updatedAt: json['updatedAt'] is int ? json['updatedAt'] : null,
      author: json['author'],
      views: json['views'] ?? 0,
      liveUpdates: (json['liveUpdates'] as List<dynamic>?)
              ?.map((e) => LiveUpdate.fromJson(Map<String, dynamic>.from(e)))
              .toList() ??
          [],
      tags: List<String>.from(json['tags'] ?? []),
      videoUrl: json['videoUrl'],
      isLeader: json['isLeader'] ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'shortDescription': shortDescription,
        'content': content,
        'imageUrl': imageUrl,
        'additionalImages': additionalImages,
        'category': category,
        'categories': categories,
        'isBreaking': isBreaking,
        'isPinned': isPinned,
        'isFeaturedLayout': isFeaturedLayout,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
        'author': author,
        'views': views,
        'liveUpdates': liveUpdates.map((e) => e.toJson()).toList(),
        'tags': tags,
        'videoUrl': videoUrl,
        'isLeader': isLeader,
      };
}

class UrgentNews {
  final String id;
  final String text;
  final int createdAt;
  final int expiresAt;
  final bool isActive;

  UrgentNews({
    required this.id,
    required this.text,
    required this.createdAt,
    required this.expiresAt,
    this.isActive = true,
  });

  factory UrgentNews.fromJson(Map<String, dynamic> json, {String? docId}) {
    return UrgentNews(
      id: docId ?? json['id'] ?? '',
      text: json['text'] ?? '',
      createdAt: json['createdAt'] ?? DateTime.now().millisecondsSinceEpoch,
      expiresAt: json['expiresAt'] ?? (DateTime.now().millisecondsSinceEpoch + 86400000),
      isActive: json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'text': text,
        'createdAt': createdAt,
        'expiresAt': expiresAt,
        'isActive': isActive,
      };
}
