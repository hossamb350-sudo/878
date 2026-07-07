import sqlite3
import json
import os
from datetime import datetime

def extract():
    db_path = 'mlz.db'
    if not os.path.exists(db_path):
        print(f"Error: {db_path} not found")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Extract Series
    cursor.execute("SELECT m_id, m_name FROM m_master")
    series_rows = cursor.fetchall()
    series_list = []
    for row in series_rows:
        series_list.append({
            "id": str(row[0]),
            "title": row[1],
            "description": "",
            "imageUrl": "",
            "order": row[0],
            "createdAt": int(datetime.now().timestamp() * 1000)
        })

    # 2. Extract Lessons
    cursor.execute("SELECT mlz_id, m_xid, mlz_name, mlz_date FROM malazm")
    lesson_rows = cursor.fetchall()
    lessons_list = []
    
    for row in lesson_rows:
        mlz_id = row[0]
        series_id = str(row[1])
        title = row[2]
        mlz_date = row[3]
        
        # Fetch all pages for this lesson
        cursor.execute("SELECT mlz_content FROM malazim_pages WHERE mlz_id = ? ORDER BY mlz_page", (mlz_id,))
        pages = cursor.fetchall()
        full_content = "\n".join([p[0] for p in pages if p[0]])
        
        created_at = int(datetime.now().timestamp() * 1000)
        if mlz_date:
            try:
                # Assuming date format YYYY-MM-DD
                dt = datetime.strptime(mlz_date, '%Y-%m-%d')
                created_at = int(dt.timestamp() * 1000)
            except:
                pass

        lessons_list.append({
            "id": str(mlz_id),
            "seriesId": series_id,
            "title": title,
            "content": full_content,
            "excerpt": full_content[:200] + "..." if len(full_content) > 200 else full_content,
            "order": mlz_id,
            "createdAt": created_at
        })

    data = {
        "series": series_list,
        "lessons": lessons_list
    }

    output_path = 'Resources/quranData.json'
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)

    conn.close()
    print(f"Successfully extracted {len(series_list)} series and {len(lessons_list)} lessons to {output_path}")

if __name__ == "__main__":
    extract()
