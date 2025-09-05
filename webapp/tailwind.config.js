/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-dark': 'var(--color-bg-dark)',
        'bg-dark2': 'var(--color-bg-dark2)',
        'accent-blue': 'var(--color-accent-blue)',
        'accent-gold': 'var(--color-accent-gold)',
        'text-light': 'var(--color-text-light)',
        'text-muted': 'var(--color-text-muted)',
      },
      backdropFilter: {
        'none': 'none',
        'blur': 'blur(16px)',
      },
    },
  },
  plugins: [],
}
