import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/news_item.dart';
import '../../providers/news_provider.dart';

class AdminUrgentNewsScreen extends StatefulWidget {
  const AdminUrgentNewsScreen({super.key});

  @override
  State<AdminUrgentNewsScreen> createState() => _AdminUrgentNewsScreenState();
}

class _AdminUrgentNewsScreenState extends State<AdminUrgentNewsScreen> {
  final _textController = TextEditingController();

  void _addUrgent() {
    if (_textController.text.trim().isEmpty) return;

    final urgent = UrgentNews(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: _textController.text.trim(),
      createdAt: DateTime.now().millisecondsSinceEpoch,
      expiresAt: DateTime.now().millisecondsSinceEpoch + (24 * 3600 * 1000),
    );

    Provider.of<NewsProvider>(context, listen: false).addUrgentNews(urgent);
    _textController.clear();

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('تم إضافة الخبر العاجل للشرائط المباشرة')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final newsProvider = Provider.of<NewsProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('إدارة الشريط العاجل'),
        backgroundColor: Colors.red.shade800,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAlignment.start,
                  children: [
                    const Text('نشر خبر عاجل جديد', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _textController,
                      decoration: const InputDecoration(
                        hintText: 'اكتب نص الخبر العاجل هنا...',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _addUrgent,
                        icon: const Icon(Icons.bolt),
                        label: const Text('إطلاق في الشريط الأحمـر'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red.shade800,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Row(
              children: [
                Icon(Icons.list, color: Colors.red),
                SizedBox(width: 8),
                Text('الأخبار العاجلة النشطة حالياً', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ],
            ),
            const SizedBox(height: 8),
            Expanded(
              child: newsProvider.urgentNews.isEmpty
                  ? const Center(child: Text('لا توجد أخبار عاجلة نشطة'))
                  : ListView.builder(
                      itemCount: newsProvider.urgentNews.length,
                      itemBuilder: (context, index) {
                        final item = newsProvider.urgentNews[index];
                        return Card(
                          child: ListTile(
                            leading: const CircleAvatar(
                              backgroundColor: Colors.red,
                              child: Icon(Icons.bolt, color: Colors.white),
                            ),
                            title: Text(item.text, style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: const Text('صالح لممدة 24 ساعة'),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
