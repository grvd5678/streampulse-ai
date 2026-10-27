/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        twitch: {
          bg: '#0E0E10',
          card: '#18181B',
          hover: '#1F1F23',
          border: '#2D2D35',
          purple: '#9146FF',
          purpleDark: '#772CE8',
          text: '#EFEFF1',
          muted: '#ADADB8',
          accent: '#00F59B'
        }
      }
    },
  },
  plugins: [],
}

