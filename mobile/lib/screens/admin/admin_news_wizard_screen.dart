import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/news_item.dart';
import '../../providers/news_provider.dart';
import '../../services/api_service.dart';

class AdminNewsWizardScreen extends StatefulWidget {
  const AdminNewsWizardScreen({super.key});

  @override
  State<AdminNewsWizardScreen> createState() => _AdminNewsWizardScreenState();
}

class _AdminNewsWizardScreenState extends State<AdminNewsWizardScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  final _shortDescController = TextEditingController();
  final _imageUrlController = TextEditingController();
  String _category = 'اخبار محلية';
  bool _isBreaking = false;
  bool _isPinned = false;
  bool _isAiGenerating = false;

  void _generateAiContent() async {
    if (_titleController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('الرجاء أدخل عنوان الخبر أولاً للاستعانة بالذكاء الاصطناعي')),
      );
      return;
    }

    setState(() {
      _isAiGenerating = true;
    });

    final aiResult = await ApiService.generateAiNewspaperAssist(
      prompt: _titleController.text,
      action: 'expand_article',
    );

    setState(() {
      _isAiGenerating = false;
    });

    if (aiResult != null && aiResult.isNotEmpty) {
      _contentController.text = aiResult;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم توليد تفاصيل الخبر بالذكاء الاصطناعي بنجاح')),
      );
    }
  }

  void _saveNews() {
    if (_formKey.currentState!.validate()) {
      final newItem = NewsItem(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        title: _titleController.text,
        shortDescription: _shortDescController.text.isNotEmpty ? _shortDescController.text : null,
        content: _contentController.text,
        category: _category,
        imageUrl: _imageUrlController.text.isNotEmpty ? _imageUrlController.text : 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800',
        isBreaking: _isBreaking,
        isPinned: _isPinned,
        createdAt: DateTime.now().millisecondsSinceEpoch,
        author: 'مدير النظام',
      );

      Provider.of<NewsProvider>(context, listen: false).addNewsItem(newItem);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم نشر الخبر بنجاح في المنصة')),
      );

      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('معالج نشر الأخبار'),
        backgroundColor: Colors.teal.shade800,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAlignment.start,
            children: [
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'عنوان الخبر الرئيسي *',
                  border: OutlineInputBorder(),
                ),
                validator: (val) => val == null || val.isEmpty ? 'الرجاء إدخال العنوان' : null,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      value: _category,
                      decoration: const InputDecoration(
                        labelText: 'القسم',
                        border: OutlineInputBorder(),
                      ),
                      items: ['اخبار محلية', 'سياسة', 'اقتصاد', 'ثقافة وفن', 'رياضة', 'تقارير']
                          .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                          .toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _category = val);
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _shortDescController,
                decoration: const InputDecoration(
                  labelText: 'الملخص السريع (اختياري)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('محتوى الخبر التفصيلي *', style: TextStyle(fontWeight: FontWeight.bold)),
                  ElevatedButton.icon(
                    onPressed: _isAiGenerating ? null : _generateAiContent,
                    icon: _isAiGenerating
                        ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.auto_awesome, size: 16),
                    label: const Text('مساعد الذكاء الاصطناعي', style: TextStyle(fontSize: 12)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.purple.shade700,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              TextFormField(
                controller: _contentController,
                maxLines: 8,
                decoration: const InputDecoration(
                  hintText: 'اكتب نص الخبر أو استعن بالذكاء الاصطناعي...',
                  border: OutlineInputBorder(),
                ),
                validator: (val) => val == null || val.isEmpty ? 'الرجاء إدخال التفاصيل' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _imageUrlController,
                decoration: const InputDecoration(
                  labelText: 'رابط الصورة الرئيسية (URL)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.image),
                ),
              ),
              const SizedBox(height: 12),
              SwitchListTile(
                title: const Text('خبر عاجل (يظهر في الشريط الاحمر)'),
                value: _isBreaking,
                onChanged: (val) => setState(() => _isBreaking = val),
              ),
              SwitchListTile(
                title: const Text('تثبيت الخبر في الواجهة الرئيسية'),
                value: _isPinned,
                onChanged: (val) => setState(() => _isPinned = val),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: _saveNews,
                  icon: const Icon(Icons.publish),
                  label: const Text('نشر الخبر الآن', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.teal.shade800,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
