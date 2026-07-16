import sys

with open("src/pages/Admin.tsx", "r") as f:
    content = f.read()

content = content.replace("  const uniqueTypes = Array.from(new Set(activities.map(a => a.type || a.title).filter(Boolean)));", "  const baseTypes = [\"مسيرة\", \"وقفة\", \"أمسية\", \"مؤتمر\", \"ندوة\", \"مهرجان\"];\\n  const uniqueTypes = Array.from(new Set([...baseTypes, ...activities.map(a => a.type || a.title).filter(Boolean)]));")

datalist_str = """            <datalist id="activity-types">
              {uniqueTypes.map((t, idx) => (
                <option key={idx} value={t} />
              ))}
              <option value="مسيرة" />
              <option value="وقفة" />
              <option value="أمسية" />
              <option value="مؤتمر" />
              <option value="ندوة" />
              <option value="مهرجان" />
            </datalist>"""

new_datalist_str = """            <datalist id="activity-types">
              {uniqueTypes.map((t, idx) => (
                <option key={idx} value={t} />
              ))}
            </datalist>"""

content = content.replace(datalist_str, new_datalist_str)

with open("src/pages/Admin.tsx", "w") as f:
    f.write(content)
