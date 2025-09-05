/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'bg-dark': '#22223B',
                'bg-dark2': '#4A4E69',
                'accent-orange': '#FF8C42',
                'accent-pink': '#FF6B6B',
                'accent-blue': '#4A4E69',
                'accent-gold': '#FFD700',
                'text-light': '#FFFFFF',
                'text-muted': '#9CA3AF',
            },
            backdropFilter: {
                'none': 'none',
                'blur': 'blur(16px)',
            },
        },
    },
    plugins: [],
}