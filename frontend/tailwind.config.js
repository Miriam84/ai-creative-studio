/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        studio: {
          bg: "#0B0D13",
          card: "#131722",
          cardBorder: "#23293B",
          accent: "#6366F1",
          accentHover: "#4F46E5",
          magnific: "#EC4899",
          higgsfield: "#8B5CF6",
          elevenlabs: "#10B981",
        }
      }
    },
  },
  plugins: [],
}
