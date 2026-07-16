import sys

with open("src/pages/Admin.tsx", "r") as f:
    content = f.read()

content = content.replace("];\\n  const uniqueTypes", "];\n  const uniqueTypes")

with open("src/pages/Admin.tsx", "w") as f:
    f.write(content)
