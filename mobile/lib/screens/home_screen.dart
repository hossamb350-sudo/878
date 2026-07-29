import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/news_provider.dart';
import '../providers/theme_provider.dart';
import '../widgets/breaking_ticker_widget.dart';
import '../widgets/weather_prayer_header.dart';
import '../widgets/category_bar.dart';
import '../widgets/news_card.dart';
import 'quran_kareem_screen.dart';
import 'prayer_times_screen.dart';
import 'user_profile_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      Provider.of<NewsProvider>(context, listen: false).loadSampleNews();
    });
  }

  Widget _buildNewsFeed(BuildContext context) {
    final newsProvider = Provider.of<NewsProvider>(context);

    return RefreshIndicator(
      onRefresh: () async {
        newsProvider.loadSampleNews();
      },
      child: ListView(
        children: [
          const BreakingTickerWidget(),
          const WeatherPrayerHeader(),
          const CategoryBar(),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Text(
              'أحدث الأخبار والتقارير',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.teal),
            ),
          ),
          if (newsProvider.isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(30),
                child: CircularProgressIndicator(),
              ),
            )
          else if (newsProvider.newsItems.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(30),
                child: Text('لا توجد أخبار متاحة في هذا القسم حالياً'),
              ),
            )
          else
            ...newsProvider.newsItems.map((news) => NewsCard(newsItem: news)),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      _buildNewsFeed(context),
      const QuranKareemScreen(),
      const PrayerTimesScreen(),
      const UserProfileScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(Icons.newspaper, color: Colors.white),
            SizedBox(width: 8),
            Text(
              'منصة تعز الإعلامية',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
        backgroundColor: Colors.teal.shade800,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const SettingsScreen(),
                ),
              );
            },
          ),
        ],
      ),
      body: IndexedStack(
        index: _selectedIndex,
        children: pages,
      ),
      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'الرئيسية',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.menu_book),
            label: 'القرآن',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.access_time),
            label: 'الصلاة',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'حسابي',
          ),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: Colors.teal.shade800,
        unselectedItemColor: Colors.grey.shade600,
        type: BottomNavigationBarType.fixed,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
      ),
    );
  }
}
