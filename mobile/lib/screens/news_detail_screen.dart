import 'package:flutter/material.dart';
import '../models/news_item.dart';

class NewsDetailScreen extends StatefulWidget {
  final NewsItem newsItem;

  const NewsDetailScreen({super.key, required this.newsItem});

  @override
  State<NewsDetailScreen> createState() => _NewsDetailScreenState();
}

class _NewsDetailScreenState extends State<NewsDetailScreen> {
  double _fontSize = 16.0;
  bool _isBookmarked = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.newsItem.category),
        actions: [
          IconButton(
            icon: Icon(_isBookmarked ? Icons.bookmark : Icons.bookmark_border),
            onPressed: () {
              setState(() {
                _isBookmarked = !_isBookmarked;
              });
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(_isBookmarked ? 'تم إضافة الخبر إلى المحفوظات' : 'تم إزالة الخبر من المحفوظات'),
                  duration: const Duration(seconds: 1),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.share),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('تم نسخ رابط الخبر مشاركة')),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAlignment.start,
          children: [
            Text(
              widget.newsItem.title,
              style: TextStyle(
                fontSize: _fontSize + 4,
                fontWeight: FontWeight.bold,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.person, size: 16, color: Colors.teal),
                    const SizedBox(width: 4),
                    Text(
                      widget.newsItem.author ?? 'محرر الأخبار',
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                    ),
                  ],
                ),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.text_increase),
                      onPressed: () => setState(() => _fontSize = (_fontSize + 2).clamp(14, 26)),
                    ),
                    IconButton(
                      icon: const Icon(Icons.text_decrease),
                      onPressed: () => setState(() => _fontSize = (_fontSize - 2).clamp(14, 26)),
                    ),
                  ],
                ),
              ],
            ),
            const Divider(height: 20),
            if (widget.newsItem.imageUrl != null) ...[
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(
                  widget.newsItem.imageUrl!,
                  width: double.infinity,
                  height: 220,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
                ),
              ),
              const SizedBox(height: 16),
            ],
            Text(
              widget.newsItem.content,
              style: TextStyle(
                fontSize: _fontSize,
                height: 1.8,
                color: Colors.black87,
              ),
            ),
            if (widget.newsItem.liveUpdates.isNotEmpty) ...[
              const SizedBox(height: 24),
              const Text(
                'التحديثات المباشرة',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.teal),
              ),
              const SizedBox(height: 10),
              ...widget.newsItem.liveUpdates.map((update) => Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAlignment.start,
                        children: [
                          Text(
                            update.time,
                            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.teal, fontSize: 12),
                          ),
                          const SizedBox(height: 4),
                          Text(update.text, style: const TextStyle(fontSize: 14)),
                        ],
                      ),
                    ),
                  )),
            ],
          ],
        ),
      ),
    );
  }
}
