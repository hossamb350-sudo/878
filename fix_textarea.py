import sys

with open("src/pages/Admin.tsx", "r") as f:
    content = f.read()

old_textarea = '''        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">وصف الفعالية (اختياري)</label>
          <textarea
            className="w-full p-4 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl h-40 resize-y leading-relaxed"
            placeholder="اكتب وصفاً تفصيلياً للفعالية..."
            value={actDesc}
            onChange={(e) => setActDesc(e.target.value)}
          />
        </div>'''

new_textarea = '''        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">وصف الفعالية (اختياري)</label>
          <textarea
            className="w-full p-5 text-lg font-medium leading-relaxed bg-gray-50 dark:bg-gray-900 border-none rounded-2xl h-64 focus:ring-2 focus:ring-blue-500 transition-all resize-y placeholder:text-gray-300"
            placeholder="اكتب وصفاً تفصيلياً للفعالية هنا..."
            value={actDesc}
            onChange={(e) => setActDesc(e.target.value)}
          />
        </div>'''

if old_textarea in content:
    content = content.replace(old_textarea, new_textarea)
else:
    print("Could not find textarea to replace")

with open("src/pages/Admin.tsx", "w") as f:
    f.write(content)
