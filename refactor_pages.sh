#!/bin/bash
cd src/pages

# List of pages and their target folders
declare -A pages=(
    ["Home.tsx"]="home"
    ["NewsDetail.tsx"]="news"
    ["Articles.tsx"]="articles"
    ["ArticleDetail.tsx"]="articles"
    ["Watch.tsx"]="watch"
    ["WatchItem.tsx"]="watch"
    ["Leader.tsx"]="leader"
    ["LeaderItem.tsx"]="leader"
    ["Quran.tsx"]="quran"
    ["Events.tsx"]="events"
    ["ActivityDetail.tsx"]="events"
    ["WeatherDetail.tsx"]="weather"
    ["PrayerTimesDetail.tsx"]="prayer-times"
    ["CalendarDetail.tsx"]="calendar"
    ["TopicDetail.tsx"]="topic"
    ["Search.tsx"]="search"
    ["Admin.tsx"]="admin"
)

for file in "${!pages[@]}"; do
    folder="${pages[$file]}"
    mkdir -p "$folder"
    if [ -f "$file" ]; then
        mv "$file" "$folder/"
        # Replace `../` with `../../` for all local imports. 
        # But only for lines starting with import
        sed -i 's|from "../|from "../../|g' "$folder/$file"
        # Edge cases: `import { ... } from '../...'`
        sed -i "s|from '../|from '../../|g" "$folder/$file"
    fi
done
