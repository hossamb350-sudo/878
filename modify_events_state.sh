sed -i '42a\  const [activities, setActivities] = useState<any[]>([]);\n  const [activeMainTab, setActiveMainTab] = useState<"calendar" | "activities">("calendar");\n' src/pages/Events.tsx
