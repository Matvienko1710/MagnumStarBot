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
            spacing: {
                'safe-top': 'env(safe-area-inset-top)',
                'safe-bottom': 'env(safe-area-inset-bottom)',
                'safe-left': 'env(safe-area-inset-left)',
                'safe-right': 'env(safe-area-inset-right)',
            },
            minHeight: {
                'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
                'dvh': '100dvh',
            },
            height: {
                'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
                'dvh': '100dvh',
            },
            fontSize: {
                'touch': ['18px', '24px'], // Больший размер для мобильных
            },
            // Улучшенные размеры для тач-интерфейса
            minWidth: {
                'touch': '44px', // Минимальная ширина касания
            },
            minHeight: {
                'touch': '44px', // Минимальная высота касания
            },
        },
        // Брейкпоинты для мобильных устройств
        screens: {
            'xs': '375px',
            'sm': '640px',
            'md': '768px',
            'lg': '1024px',
            'xl': '1280px',
            '2xl': '1536px',
            // Высота экрана
            'h-sm': {'raw': '(max-height: 640px)'},
            'h-md': {'raw': '(max-height: 768px)'},
            'h-lg': {'raw': '(min-height: 769px)'},
        },
    },
    plugins: [],
}