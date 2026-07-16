awk '
BEGIN { in_return = 0; inserted = 0; }
/return \(/ {
    print;
    in_return = 1;
    next;
}
/className="max-w-7xl mx-auto w-full p-4 pb-20 space-y-8 font-sans"/ {
    if (in_return && !inserted) {
        print "    <div className=\"max-w-7xl mx-auto w-full p-4 pb-20 space-y-8 font-sans\" dir=\"rtl\">";
        print "      <div className=\"relative bg-surface-card p-1.5 rounded-2xl flex border border-border-light shadow-sm w-full max-w-sm mx-auto mb-6\">";
        print "        {[\"calendar\", \"activities\"].map((tab) => (";
        print "          <button";
        print "            key={tab}";
        print "            onClick={() => setActiveMainTab(tab as any)}";
        print "            className={`relative flex-1 py-3 text-sm font-black transition-colors z-10 ${";
        print "              activeMainTab === tab ? \"text-white\" : \"text-text-muted hover:text-text-primary\"";
        print "            }`}";
        print "          >";
        print "            {activeMainTab === tab && (";
        print "              <motion.div";
        print "                layoutId=\"activeMainTabIndicator\"";
        print "                className=\"absolute inset-0 bg-taiz-navy rounded-xl -z-10\"";
        print "                transition={{ type: \"spring\", stiffness: 300, damping: 25 }}";
        print "              />";
        print "            )}";
        print "            {tab === \"calendar\" ? \"التقويم\" : \"الفعاليات\"}";
        print "          </button>";
        print "        ))}";
        print "      </div>";
        print "";
        print "      <AnimatePresence mode=\"wait\" initial={false}>";
        print "        {activeMainTab === \"calendar\" && (";
        print "          <motion.div";
        print "            key=\"calendar\"";
        print "            initial={{ opacity: 0, x: -20 }}";
        print "            animate={{ opacity: 1, x: 0 }}";
        print "            exit={{ opacity: 0, x: 20 }}";
        print "            transition={{ duration: 0.2 }}";
        print "            drag=\"x\"";
        print "            dragConstraints={{ left: 0, right: 0 }}";
        print "            onDragEnd={(e, { offset }) => {";
        print "              if (offset.x < -50 || offset.x > 50) {";
        print "                setActiveMainTab(\"activities\");";
        print "              }";
        print "            }}";
        print "            className=\"space-y-8\"";
        print "          >";
        inserted = 1;
        next;
    }
}
/dir="rtl"/ {
    if (inserted && !dir_skipped) {
        dir_skipped = 1;
        next;
    }
}
{ print }
' src/pages/Events.tsx > tmp.tsx && mv tmp.tsx src/pages/Events.tsx
