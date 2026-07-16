import sys

with open("src/pages/Events.tsx", "r") as f:
    content = f.read()

content = content.replace('<p className="text-xs font-bold text-text-secondary">{act.description}</p>', '<p className="text-xs font-bold text-text-secondary whitespace-pre-wrap">{act.description}</p>')

with open("src/pages/Events.tsx", "w") as f:
    f.write(content)
