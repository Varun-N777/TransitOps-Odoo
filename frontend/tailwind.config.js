/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Quicksand', 'sans-serif'],
        mono: ['Source Code Pro', 'monospace'],
        display: ['Hammersmith One', 'sans-serif'],
        overpass: ['Overpass', 'sans-serif'],
        pixel: ['Geist Pixel', 'sans-serif'],
        script: ['Dancing Script', 'cursive'],
        petemoss: ['Petemoss', 'cursive'],
        amita: ['Amita', 'cursive'],
        jaini: ['Jaini Purva', 'sans-serif'],
        play: ['Play', 'sans-serif'],
      },
      colors: {
        darkBg: '#0f172a',
        darkCard: '#1e293b',
        primary: '#3b82f6',
      }
    },
  },
  plugins: [],
}
