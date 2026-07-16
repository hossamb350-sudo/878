cat << 'INNER_EOF' > /tmp/new_chunk.tsx
                    onView={() => setSelectedEventId(event.id)}
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
          className="space-y-8 bg-surface-card rounded-2xl p-6 border border-border-light text-center min-h-[60vh] flex flex-col items-center justify-center"
        >
          <h3 className="text-xl font-black text-text-primary mb-2">الفعاليات</h3>
          <p className="text-sm font-bold text-text-secondary">
            سيتم إدراج الفعاليات هنا ويمكن إدارتها من لوحة الإدارة
          </p>
        </motion.div>
      )}
      </AnimatePresence>

      <EventDetailsModal
        event={selectedEvent}
        events={events}
        onClose={() => setSelectedEventId(null)}
        onNavigateToSyllabus={() => {}}
      />
    </div>
  );
}
INNER_EOF
sed -i '991,1035c\
'$(cat /tmp/new_chunk.tsx | awk '{printf "%s\\n", $0}') src/pages/Events.tsx
