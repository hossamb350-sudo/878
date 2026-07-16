import sys

with open("src/pages/Events.tsx", "r") as f:
    content = f.read()

content = content.replace("title: act.title,", "title: act.type || act.title,")

content = content.replace("dayName: format(date, \"EEEE\", { locale: ar }),", "dayName: act.dayName || format(date, \"EEEE\", { locale: ar }),")
content = content.replace('hijriDate: new Intl.DateTimeFormat("ar-SA-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" }).format(date) + " هـ",', 'hijriDate: act.hijriDate || new Intl.DateTimeFormat("ar-SA-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" }).format(date) + " هـ",')
content = content.replace('gregorianDate: format(date, "d MMMM yyyy", { locale: ar }),', 'gregorianDate: act.gregorianDate || format(date, "d MMMM yyyy", { locale: ar }),')

content = content.replace('alt={act.title}', 'alt={act.type || act.title}')
content = content.replace('<h4 className="text-base font-black text-text-primary">{act.title}</h4>', '<h4 className="text-base font-black text-text-primary">{act.type || act.title}</h4>')

content = content.replace('يبدأ: {new Date(act.startDate).toLocaleDateString(\'ar-EG\')}', '{act.dayName} {act.gregorianDate}')
content = content.replace('{act.endDate && <span className="bg-white/50 px-2 py-1 rounded">ينتهي: {new Date(act.endDate).toLocaleDateString(\'ar-EG\')}</span>}', '{act.hijriDate && <span className="bg-white/50 px-2 py-1 rounded">{act.hijriDate}</span>}')
content = content.replace('{act.location && <span className="bg-white/50 px-2 py-1 rounded">الموقع: {act.location}</span>}', '{act.startTime && <span className="bg-white/50 px-2 py-1 rounded">يبدأ: {act.startTime}</span>}{act.endTime && <span className="bg-white/50 px-2 py-1 rounded">ينتهي: {act.endTime}</span>}')

with open("src/pages/Events.tsx", "w") as f:
    f.write(content)

