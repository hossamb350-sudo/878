sed -i 's/              const swipe = offset.x \* velocity.x;\n              if (swipe < -10000) {/              if (offset.x < -50 || offset.x > 50) {/' src/pages/Events.tsx
