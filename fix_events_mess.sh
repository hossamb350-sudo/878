sed -i '1002,1004d' src/pages/Events.tsx
sed -i '1002i\        {activeMainTab === "activities" && (' src/pages/Events.tsx
