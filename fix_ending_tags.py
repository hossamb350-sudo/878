import sys

with open("src/pages/Events.tsx", "r") as f:
    content = f.read()

search_text = """              {filteredEvents.length === 0 && <NoResultsFound />}
            </div>
          )}
          </motion.div>
        </AnimatePresence>
        )}"""

replace_text = """              {filteredEvents.length === 0 && <NoResultsFound />}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      </motion.div>
    )}"""

content = content.replace(search_text, replace_text)

with open("src/pages/Events.tsx", "w") as f:
    f.write(content)
