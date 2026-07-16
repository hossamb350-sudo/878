import sys

with open("src/pages/Events.tsx", "r") as f:
    content = f.read()

# I will find this:
search_text = """              {filteredEvents.length === 0 && <NoResultsFound />}
            </div>
          )}
          </motion.div>
        )}

        {activeMainTab === "activities" && ("""

replace_text = """              {filteredEvents.length === 0 && <NoResultsFound />}
            </div>
          )}
          </motion.div>
        </AnimatePresence>
        )}

        {activeMainTab === "activities" && ("""

content = content.replace(search_text, replace_text)

with open("src/pages/Events.tsx", "w") as f:
    f.write(content)
