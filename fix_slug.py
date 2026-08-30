with open("src/pages/leader/[slug].tsx", "r") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if "RELATED MATERIALS SECTION" in line or "=====" in line or "relatedContent.length > 0 && (" in line:
        pass
    else:
        new_lines.append(line)

with open("src/pages/leader/[slug].tsx", "w") as f:
    f.writelines(new_lines)
