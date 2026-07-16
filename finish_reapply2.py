import sys

with open("src/pages/Events.tsx", "r") as f:
    content = f.read()

chunk_to_replace = """                    onView={() => setSelectedEventId(event.id)}
                  />
                ))}
              </div>
              {filteredEvents.length === 0 && <NoResultsFound />}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Event Details Modal */}"""

new_chunk = """                    onView={() => setSelectedEventId(event.id)}
                  />
                ))}
              </div>
              {filteredEvents.length === 0 && <NoResultsFound />}
            </div>
          )}
          </motion.div>
        )}

        {activeMainTab === "activities" && (
          <motion.div
            key="activities"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(e, { offset }) => {
              if (offset.x < -50 || offset.x > 50) {
                setActiveMainTab("calendar");
              }
            }}
            className="space-y-8 bg-surface-card rounded-2xl p-6 border border-border-light min-h-[60vh] flex flex-col items-center justify-center"
          >
            <h3 className="text-xl font-black text-text-primary mb-2">الفعاليات</h3>
            <p className="text-sm font-bold text-text-secondary mb-6 text-center">
              إدارة وعرض الفعاليات الخاصة بك
            </p>
            <div className="w-full max-w-4xl space-y-4">
              {activities.length === 0 ? (
                <div className="text-text-muted text-sm font-bold text-center">لا توجد فعاليات مضافة حالياً.</div>
              ) : (
                activities.map(act => (
                  <div key={act.id} className="bg-surface-main p-4 rounded-xl border border-border-light flex flex-col md:flex-row gap-4 items-start md:items-center text-right shadow-sm w-full">
                    {act.imageUrl && (
                      <img src={act.imageUrl} alt={act.title} className="w-full md:w-32 h-32 md:h-24 object-cover rounded-lg" />
                    )}
                    <div className="flex-1 space-y-2 w-full text-right">
                      <h4 className="text-base font-black text-text-primary">{act.title}</h4>
                      <p className="text-xs font-bold text-text-secondary">{act.description}</p>
                      <div className="flex flex-wrap gap-4 text-[10px] text-text-muted font-black mt-2">
                        <span className="bg-white/50 px-2 py-1 rounded">يبدأ: {new Date(act.startDate).toLocaleDateString('ar-EG')}</span>
                        {act.endDate && <span className="bg-white/50 px-2 py-1 rounded">ينتهي: {new Date(act.endDate).toLocaleDateString('ar-EG')}</span>}
                        {act.location && <span className="bg-white/50 px-2 py-1 rounded">الموقع: {act.location}</span>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Details Modal */}"""

if chunk_to_replace in content:
    content = content.replace(chunk_to_replace, new_chunk)
else:
    print("CHUNK NOT FOUND!")

with open("src/pages/Events.tsx", "w") as f:
    f.write(content)

