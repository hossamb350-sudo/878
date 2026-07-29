import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/news_provider.dart';

class CategoryBar extends StatelessWidget {
  final List<String> categories = const [
    'الكل',
    'اخبار محلية',
    'سياسة',
    'اقتصاد',
    'ثقافة وفن',
    'رياضة',
    'تقارير',
  ];

  const CategoryBar({super.key});

  @override
  Widget build(BuildContext context) {
    final newsProvider = Provider.of<NewsProvider>(context);

    return Container(
      height: 44,
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        itemCount: categories.length,
        itemBuilder: (context, index) {
          final cat = categories[index];
          final isSelected = newsProvider.selectedCategory == cat;

          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: ChoiceChip(
              label: Text(cat),
              selected: isSelected,
              selectedColor: Colors.teal,
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : Colors.black87,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                fontSize: 13,
              ),
              backgroundColor: Colors.grey.shade200,
              onSelected: (selected) {
                if (selected) {
                  newsProvider.setCategory(cat);
                }
              },
            ),
          );
        },
      ),
    );
  }
}
