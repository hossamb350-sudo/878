import React from "react";
import { NewspaperIssue, NewspaperPage, NewspaperArticleRef } from "../types";
import { User } from "lucide-react";

interface NewspaperLayoutEngineProps {
  page: NewspaperPage;
  issue: NewspaperIssue;
  themeStyle: any;
}

export const NewspaperLayoutEngine: React.FC<NewspaperLayoutEngineProps> = ({
  page,
  issue,
  themeStyle,
}) => {
  // Baseline Grid: 5mm for alignment
  const BASELINE_MM = 5;

  return (
    <section
      className="grid relative"
      style={{
        gridTemplateColumns: `repeat(${page.gridColumns || 6}, minmax(0, 1fr))`,
        gap: `${page.columnGap || 5}mm`,
        // Background pattern for visual baseline grid in print preview (optional)
        // backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)',
        // backgroundSize: `100% ${BASELINE_MM}mm`
      }}
    >
      {page.items && page.items.length > 0 ? (
        page.items.map((item, iIdx) => {
          const isAd = item.sourceType === "ad";
          const colSpan = item.colSpan || item.columns || 1;
          const rowSpan = item.rowSpan || 1;
          const importance = item.importance || "low";

          // Dynamic typography based on importance and rules
          const titleSize = importance === "high" ? "34pt" : importance === "medium" ? "24pt" : "16pt";
          const subtitleSize = importance === "high" ? "18pt" : "13pt";
          const bodySize = "10.5pt";
          const lineHeight = "1.35"; // ~ 135% for readability

          if (isAd) {
            return (
              <div
                key={item.id || iIdx}
                className="border-2 border-dashed border-current/30 flex items-center justify-center bg-current/5 p-4"
                style={{
                  gridColumn: `span ${colSpan}`,
                  gridRow: `span ${rowSpan}`,
                  minHeight: "150px",
                }}
              >
                <div className="text-center opacity-60">
                  <span className="block text-xs uppercase tracking-widest mb-2 font-bold">
                    {item.title}
                  </span>
                  <span className="block font-serif text-sm">{item.content}</span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={item.id || iIdx}
              className={`flex flex-col justify-between transition-all ${
                item.featuredBox
                  ? "bg-amber-500/5 border border-amber-500/30 p-4 shadow-sm"
                  : "bg-transparent p-0"
              }`}
              style={{
                gridColumn: `span ${colSpan}`,
                gridRow: `span ${rowSpan}`,
                // Snapping content slightly to the baseline grid rhythm
                marginBottom: `${BASELINE_MM}mm`,
              }}
            >
              <div>
                {/* Category Tag */}
                {item.category && (
                  <span
                    className="font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 block"
                    style={{ fontSize: "10pt" }}
                  >
                    {item.category}
                  </span>
                )}

                {/* Main Title */}
                <h3
                  className="font-bold font-serif leading-tight mb-3"
                  style={{ fontSize: titleSize, lineHeight: 1.15 }}
                >
                  {item.title}
                </h3>

                {/* Subtitle / Deck */}
                {item.subtitle && (
                  <p
                    className="font-bold opacity-80 mb-3 border-r-2 border-amber-500 pr-3"
                    style={{ fontSize: subtitleSize, lineHeight: 1.3 }}
                  >
                    {item.subtitle}
                  </p>
                )}

                {/* Image if present */}
                {item.imageUrl && (
                  <div
                    className="mb-4 overflow-hidden"
                    style={{
                      maxHeight:
                        item.imageSize === "pano"
                          ? "150px"
                          : item.imageSize === "square"
                          ? "250px"
                          : "200px",
                    }}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    {item.caption && (
                      <p
                        className="py-1 px-2 bg-black/80 text-white text-center font-medium mt-1"
                        style={{ fontSize: "8pt" }}
                      >
                        {item.caption}
                      </p>
                    )}
                  </div>
                )}

                {/* Pull Quote Box if present */}
                {item.quote && (
                  <div
                    className="my-4 p-4 bg-current/5 border-r-4 border-amber-500 font-serif italic font-semibold"
                    style={{ fontSize: "14pt", lineHeight: 1.5 }}
                  >
                    "{item.quote}"
                  </div>
                )}

                {/* Article Body Content */}
                <div
                  className="font-normal text-justify opacity-95 whitespace-pre-line"
                  style={{
                    fontSize: bodySize,
                    lineHeight: lineHeight,
                    // Baseline alignment helper (approximated for web)
                    columnCount: colSpan > 2 ? 2 : 1,
                    columnGap: "5mm",
                  }}
                >
                  {item.content}
                </div>
              </div>

              {/* Author Footer */}
              {(item.authorName || item.summary) && (
                <div className="mt-5 pt-3 border-t border-current/20 flex items-center justify-between font-bold opacity-80" style={{ fontSize: "9pt" }}>
                  {item.authorName && (
                    <div className="flex items-center gap-2">
                      {item.authorPhoto ? (
                        <img
                          src={item.authorPhoto}
                          alt={item.authorName}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                      <span>بقلم: {item.authorName}</span>
                    </div>
                  )}
                  <span className="opacity-60">مادة صحفية</span>
                </div>
              )}
            </div>
          );
        })
      ) : (
        <div className="col-span-full text-center py-12 border-2 border-dashed border-current/20 opacity-60">
          <p>لا توجد مواد في هذه الصفحة.</p>
        </div>
      )}
    </section>
  );
};
