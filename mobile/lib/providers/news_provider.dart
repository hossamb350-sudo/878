import 'package:flutter/material.dart';
import '../models/news_item.dart';

class NewsProvider with ChangeNotifier {
  List<NewsItem> _newsItems = [];
  List<UrgentNews> _urgentNews = [];
  String _selectedCategory = 'الكل';
  bool _isLoading = false;

  List<NewsItem> get newsItems {
    if (_selectedCategory == 'الكل') {
      return _newsItems;
    }
    return _newsItems.where((item) => item.category == _selectedCategory || item.categories.contains(_selectedCategory)).toList();
  }

  List<NewsItem> get featuredNews => _newsItems.where((item) => item.isFeaturedLayout || item.isPinned).toList();
  List<NewsItem> get breakingNews => _newsItems.where((item) => item.isBreaking).toList();
  List<UrgentNews> get urgentNews => _urgentNews.where((item) => item.isActive).toList();
  String get selectedCategory => _selectedCategory;
  bool get isLoading => _isLoading;

  void setCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  void loadSampleNews() {
    _isLoading = true;
    notifyListeners();

    _urgentNews = [
      UrgentNews(
        id: 'u1',
        text: 'عاجل: افتتاح مشاريع جديدة في محافظة تعز تخدم أكثر من 100 ألف مواطن',
        createdAt: DateTime.now().millisecondsSinceEpoch,
        expiresAt: DateTime.now().millisecondsSinceEpoch + 86400000,
      ),
      UrgentNews(
        id: 'u2',
        text: 'عاجل: تدشين الحملة الوطنية للتبرع بالدم في مستشفى الثورة بتعز',
        createdAt: DateTime.now().millisecondsSinceEpoch,
        expiresAt: DateTime.now().millisecondsSinceEpoch + 86400000,
      )
    ];

    _newsItems = [
      NewsItem(
        id: '1',
        title: 'محافظ تعز يتفقد سير العمل في عدد من المشاريع الخدمية بالتزامن مع العام الجديد',
        shortDescription: 'قام محافظ المحافظة بزيارة ميدانية لموقع مشروع طريق تعز وتفقد سير التجهيزات الفنية والبنية التحتية.',
        content: 'قام محافظ تعز بزيارة ميدانية تفقدية لعدد من المشاريع الخدمية والتنموية في المدينة، مشدداً على أهمية سرعة إنجاز المشاريع في المواعيد المحتسبة وضمان معايير الجودة والتخطيط العمراني الممتاز.',
        category: 'اخبار محلية',
        categories: ['اخبار محلية', 'مشاريع'],
        imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800',
        isBreaking: true,
        isPinned: true,
        isFeaturedLayout: true,
        createdAt: DateTime.now().millisecondsSinceEpoch - 3600000,
        author: 'محرر الأخبار',
        views: 1250,
      ),
      NewsItem(
        id: '2',
        title: 'افتتاح معرض الصور الفوتوغرافية وتكريم المبدعين الشباب في مركز تعز الثقافي',
        shortDescription: 'شهد المركز الثقافي بتعز احتفالية مميزة تضمنت عرض عشرات الصور الفنية التي تبرز المعالم التاريخية للمدينة.',
        content: 'افتتح اليوم في المركز الثقافي بمحافظة تعز معرض الصور الفوتوغرافية السنوي بمشاركة نخبة من المصورين والمبدعين الشباب، حيث عكس المعرض صوراً جمالية وتراثية تعبر عن تاريخ تعز العريق.',
        category: 'ثقافة وفن',
        categories: ['ثقافة وفن', 'تقارير'],
        imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800',
        isBreaking: false,
        isPinned: false,
        isFeaturedLayout: false,
        createdAt: DateTime.now().millisecondsSinceEpoch - 7200000,
        author: 'أحمد الإبراهيمي',
        views: 840,
      ),
      NewsItem(
        id: '3',
        title: 'تقرير رياضي: نادي الطليعة بتعز يحقق فوزاً ثميناً في الدوري المحلي',
        shortDescription: 'تمكن فريق الطليعة من اقتناص ثلاث نقاط ثمينة بعد تغلب على منافسه بهدفين مقابل هدف.',
        content: 'حقوق نادي الطليعة انتصاراً غريباً ومستحقاً بعد مباراة حماسية شهدت حضوراً جماهيرياً كبيراً في ملعب الشهداء بمدينة تعز.',
        category: 'رياضة',
        categories: ['رياضة'],
        imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800',
        isBreaking: false,
        isPinned: false,
        isFeaturedLayout: false,
        createdAt: DateTime.now().millisecondsSinceEpoch - 14400000,
        author: 'القسم الرياضي',
        views: 530,
      ),
    ];

    _isLoading = false;
    notifyListeners();
  }

  void addNewsItem(NewsItem item) {
    _newsItems.insert(0, item);
    notifyListeners();
  }

  void addUrgentNews(UrgentNews urgent) {
    _urgentNews.insert(0, urgent);
    notifyListeners();
  }
}
