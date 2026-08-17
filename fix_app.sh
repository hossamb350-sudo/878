#!/bin/bash
cd src

sed -i 's|import { Home } from "./pages/Home";|import { Home } from "./pages/home/Home";|g' App.tsx
sed -i 's|import { NewsDetail } from "./pages/NewsDetail";|import { NewsDetail } from "./pages/news/NewsDetail";|g' App.tsx
sed -i 's|import { Watch } from "./pages/Watch";|import { Watch } from "./pages/watch/Watch";|g' App.tsx
sed -i 's|import { Leader } from "./pages/Leader";|import { Leader } from "./pages/leader/Leader";|g' App.tsx
sed -i 's|import { LeaderItem } from "./pages/LeaderItem";|import { LeaderItem } from "./pages/leader/LeaderItem";|g' App.tsx
sed -i 's|import { WatchItem } from "./pages/WatchItem";|import { WatchItem } from "./pages/watch/WatchItem";|g' App.tsx
sed -i 's|import { Quran } from "./pages/Quran";|import { Quran } from "./pages/quran/Quran";|g' App.tsx
sed -i 's|import { Events } from "./pages/Events";|import { Events } from "./pages/events/Events";|g' App.tsx
sed -i 's|import { Articles } from "./pages/Articles";|import { Articles } from "./pages/articles/Articles";|g' App.tsx
sed -i 's|import { ArticleDetail } from "./pages/ArticleDetail";|import { ArticleDetail } from "./pages/articles/ArticleDetail";|g' App.tsx
sed -i 's|import { Admin } from "./pages/Admin";|import { Admin } from "./pages/admin/Admin";|g' App.tsx
sed -i 's|import { ActivityDetail } from "./pages/ActivityDetail";|import { ActivityDetail } from "./pages/events/ActivityDetail";|g' App.tsx
sed -i 's|import { Search } from "./pages/Search";|import { Search } from "./pages/search/Search";|g' App.tsx
sed -i 's|import { WeatherDetail } from "./pages/WeatherDetail";|import { WeatherDetail } from "./pages/weather/WeatherDetail";|g' App.tsx
sed -i 's|import { PrayerTimesDetail } from "./pages/PrayerTimesDetail";|import { PrayerTimesDetail } from "./pages/prayer-times/PrayerTimesDetail";|g' App.tsx
sed -i 's|import CalendarDetail from "./pages/CalendarDetail";|import CalendarDetail from "./pages/calendar/CalendarDetail";|g' App.tsx
sed -i 's|import { TopicDetail } from "./pages/TopicDetail";|import { TopicDetail } from "./pages/topic/TopicDetail";|g' App.tsx
