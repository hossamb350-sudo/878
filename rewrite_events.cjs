const fs = require('fs');

let content = fs.readFileSync('src/pages/Events.tsx', 'utf8');

// Add useNavigate
if (!content.includes('useNavigate')) {
  content = content.replace('import { useEffect, useState, useMemo } from "react";', 'import { useEffect, useState, useMemo } from "react";\nimport { useNavigate } from "react-router-dom";');
}

// Add state for syllabuses in Events component
content = content.replace(/const \[selectedEventId, setSelectedEventId\] = useState<string \| null>\(null\);/g, 
`const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [syllabuses, setSyllabuses] = useState<any[]>([]);
  const navigate = useNavigate();`
);

// Fetch syllabuses
content = content.replace(/const unsubPromise = SyncService\.syncCollection<EventItem>\("events", \(data\) => \{/g, 
`const unsubPromise2 = SyncService.syncCollection<any>("quran_syllabuses", (data) => {
      if (!active) return;
      setSyllabuses(data);
    });

    const unsubPromise = SyncService.syncCollection<EventItem>("events", (data) => {`
);

// Cleanup syllabuses fetch
content = content.replace(/unsubPromise\.then\(unsub => unsub\(\)\);/g, 
`unsubPromise.then(unsub => unsub());
      unsubPromise2.then(unsub => unsub());`
);

// Get related syllabus for selected event
content = content.replace(/const selectedEvent = events\.find\(e => e\.id === selectedEventId\);/g, 
`const selectedEvent = events.find(e => e.id === selectedEventId);
  const relatedSyllabus = syllabuses.find(s => s.eventId === selectedEventId);`
);

// Update EventDetailsModal call
content = content.replace(/<EventDetailsModal \n         event=\{selectedEvent\} \n         events=\{events\}\n         onClose=\{\(\) => setSelectedEventId\(null\)\} \n       \/>/g, 
`<EventDetailsModal 
        event={selectedEvent} 
        events={events}
        relatedSyllabus={relatedSyllabus}
        onNavigateToSyllabus={() => {
           // We store it so Quran page can pick it up or we just navigate to quran
           navigate('/quran');
        }}
        onClose={() => setSelectedEventId(null)} 
      />`
);

// Update EventDetailsModal signature
content = content.replace(/function EventDetailsModal\(\{ event, events, onClose \}: \{ event: EventItem \| undefined, events: EventItem\[\], onClose: \(\) => void \}\) \{/g, 
`function EventDetailsModal({ event, events, onClose, relatedSyllabus, onNavigateToSyllabus }: { event: EventItem | undefined, events: EventItem[], onClose: () => void, relatedSyllabus?: any, onNavigateToSyllabus: () => void }) {`
);

// Add syllabus section inside EventDetailsModal
const syllabusUI = `
             {/* Related Syllabus Section */}
             {relatedSyllabus && (
               <div className="space-y-2">
                  <div className="flex items-center gap-1 px-1">
                     <BookOpen className="w-4 h-4 text-emerald-600" />
                     <span className="text-xs font-black text-text-secondary">مقرر الدروس المرتبط بالمناسبة</span>
                  </div>
                  <div 
                    onClick={onNavigateToSyllabus}
                    className="bg-emerald-50/50 border border-emerald-500/20 rounded-2xl p-4.5 cursor-pointer hover:bg-emerald-50 transition flex items-center justify-between group"
                  >
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                           <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-emerald-900 group-hover:text-emerald-700 transition-colors">
                             المقرر الحالي للمناسبة
                          </div>
                          <div className="text-xs text-emerald-700/80 mt-1 font-bold">
                             انقر هنا للانتقال إلى قسم هدي القرآن لقراءة المقرر
                          </div>
                        </div>
                     </div>
                     <ChevronLeft className="w-5 h-5 text-emerald-600/50 group-hover:text-emerald-600 transition-colors" />
                  </div>
               </div>
             )}
`;

content = content.replace(/\{\/\* Time Gaps between adjacent events \*\/\}/g, 
`${syllabusUI}\n\n             {/* Time Gaps between adjacent events */}`
);

// Add BookOpen icon import
content = content.replace(/Share2\n\} from "lucide-react";/g, `Share2,\n  BookOpen\n} from "lucide-react";`);

fs.writeFileSync('src/pages/Events.tsx', content);
console.log('Done rewriting Events.tsx');
