import sys

with open("src/types.ts", "r") as f:
    content = f.read()

types_replacement = """export interface ActivityItem {
  id: string;
  title?: string;
  type: string;
  dayName: string;
  hijriDate: string;
  gregorianDate: string;
  startTime?: string;
  endTime?: string;
  description: string;
  imageUrl?: string;
  startDate: number;
  endDate?: number;
  location?: string;
  createdAt: number;
}"""
content = content.replace("export interface ActivityItem {\n  id: string;\n  title: string;\n  description: string;\n  imageUrl?: string;\n  startDate: number;\n  endDate?: number;\n  location?: string;\n  createdAt: number;\n}", types_replacement)

with open("src/types.ts", "w") as f:
    f.write(content)

with open("src/pages/Admin.tsx", "r") as f:
    content = f.read()

import re

# Find AdminActivitiesContent function bounds
start_idx = content.find("function AdminActivitiesContent() {")
# Find the end of the function (since it's the last function before AdminEvents... wait, we moved AdminEvents to the bottom. Let's check what's after it.
# Actually, I can just replace the whole function by finding its start and the start of AdminEvents.
