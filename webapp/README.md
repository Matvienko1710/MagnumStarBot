# 🎨 Magnum Stars - Premium Fintech WebApp

Современное мобильное приложение для заработка монет в стиле Revolut, Monobank и Binance.

## ✨ Особенности

- **Премиум дизайн** - Glassmorphism, градиенты, плавные анимации
- **Темная тема** - Современный fintech стиль
- **Адаптивность** - Mobile-first, поддержка всех экранов
- **Доступность** - WCAG AA, клавиатурная навигация
- **Производительность** - Оптимизированные анимации и загрузки

## 📁 Структура файлов

```
webapp/
├── index-new.html      # Новый премиум дизайн (используйте этот файл)
├── styles.css         # Основные стили
├── assets/
│   └── icons/         # SVG иконки
│       ├── home.svg
│       ├── tasks.svg
│       ├── earn.svg
│       └── profile.svg
└── README.md          # Эта документация
```

## 🚀 Быстрый старт

1. **Замените основной файл:**
```bash
   cp index-new.html index.html
   ```

2. **Подключите стили:**
   ```html
   <link rel="stylesheet" href="styles.css">
   ```

3. **Настройте цвета и переменные** (опционально)

## 🎨 Настройка дизайна

### Цветовая схема

```css
:root {
  /* Основные цвета */
  --color-bg-primary: #0f172a;        /* Темный фон */
  --color-accent-primary: #3b82f6;    /* Синий акцент */
  --color-accent-secondary: #facc15;  /* Золотой акцент */

  /* Прозрачности для glassmorphism */
  --color-surface-glass: rgba(255, 255, 255, 0.08);
  --color-surface-primary: rgba(255, 255, 255, 0.05);
}
```

### Шрифты

```html
<!-- В head секции -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Размеры и отступы

```css
/* Scale система */
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-4: 1rem;      /* 16px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
```

## 🔧 Интеграция с данными

### Динамические данные

```html
<!-- Имя пользователя -->
<h2 id="user-name">Пользователь</h2>

<!-- Баланс -->
<div id="stars-balance">0</div>
<div id="coins-balance">0</div>

<!-- Статистика -->
<span id="total-clicks">0</span>
<span id="today-clicks">0</span>
```

### JavaScript интеграция

```javascript
// Обновление данных пользователя
function updateUserData(user) {
    document.getElementById('user-name').textContent = user.first_name;
    document.getElementById('user-id').textContent = `ID: ${user.id}`;
    document.getElementById('user-initials').textContent = user.first_name.charAt(0);
}

// Обновление баланса
function updateBalance(stars, coins) {
    document.getElementById('stars-balance').textContent = stars.toLocaleString();
    document.getElementById('coins-balance').textContent = coins.toLocaleString();
}

// Обновление статистики
function updateStats(stats) {
    document.getElementById('total-clicks').textContent = stats.totalClicks;
    document.getElementById('today-clicks').textContent = stats.todayClicks;
    document.getElementById('last-click').textContent = stats.lastClick ?
        stats.lastClick.toLocaleTimeString() : 'Никогда';
}
```

## 📱 Telegram WebApp интеграция

### Инициализация

```javascript
if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;

    tg.ready();        // Готовность WebApp
    tg.expand();       // Развернуть на весь экран

    // Получить данные пользователя
    if (tg.initDataUnsafe?.user) {
        updateUserData(tg.initDataUnsafe.user);
    }

    // Haptic feedback
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }
}
```

### Отправка данных боту

```javascript
// Отправка данных при завершении
function sendDataToBot(data) {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.sendData(JSON.stringify(data));
    }
}

// Пример использования
document.getElementById('submit-button').addEventListener('click', () => {
    const data = {
        action: 'complete_task',
        taskId: currentTaskId,
        timestamp: Date.now()
    };
    sendDataToBot(data);
});
```

## 🎯 Состояния компонентов

### Loading состояния

```html
<!-- Активация loading -->
<div class="loading">Загрузка...</div>

<!-- В JavaScript -->
element.classList.add('loading');
```

### Empty состояния

```html
<div class="empty-state">
    <svg class="empty-state-icon">...</svg>
    <h3 class="empty-state-title">Нет данных</h3>
    <p class="empty-state-text">Начните использовать приложение</p>
</div>
```

### Error состояния

```html
<div class="error">
    <p>❌ Произошла ошибка. Попробуйте позже.</p>
</div>
```

## 🔄 Навигация

### Bottom Navigation

```javascript
// Обработка навигации
function handleNavigation(page) {
    // Убрать активный класс со всех
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Добавить активный класс
    const targetNav = document.querySelector(`[data-page="${page}"]`);
    targetNav.classList.add('active');

    // Переключить контент
    showPage(page);
}
```

## 📊 Адаптивность

### Breakpoints

```css
/* Мобильные (< 480px) */
@media (max-width: 480px) {
    .container {
        padding: 0 12px;
    }
    .main-cta {
        width: 140px;
        height: 140px;
    }
}

/* Планшеты (768px+) */
@media (min-width: 768px) {
    .container {
        max-width: 480px;
        padding: 0 24px;
    }
    .balance-grid {
        grid-template-columns: 1fr 1fr 1fr;
    }
}
```

## ♿ Доступность

### ARIA атрибуты

```html
<!-- Кнопки -->
<button aria-label="Кликнуть для заработка монет">...</button>

<!-- Навигация -->
<nav role="navigation" aria-label="Основная навигация">
    <a href="#" aria-label="Главная страница">...</a>
</nav>

<!-- Live regions для уведомлений -->
<div aria-live="polite" aria-atomic="true">...</div>
```

### Focus management

```css
/* Focus styles */
.nav-item:focus-visible,
.balance-card:focus-visible {
    outline: 2px solid var(--color-accent-primary);
    outline-offset: 2px;
}
```

## ⚡ Производительность

### Оптимизации

1. **CSS Containment**
   ```css
   .container {
       contain: layout style paint;
   }
   ```

2. **Will-change для анимаций**
   ```css
   .main-cta {
       will-change: transform;
   }
   ```

3. **Font loading**
   ```html
   <link rel="preload" href="fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
   ```

## 🎨 Кастомизация

### Темы

```javascript
// Переключение темы
function toggleTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

// Загрузка темы
const savedTheme = localStorage.getItem('theme') || 'dark';
toggleTheme(savedTheme);
```

### Цветовые схемы

```css
/* Светлая тема */
[data-theme="light"] {
    --color-bg-primary: #ffffff;
    --color-text-primary: #0f172a;
    --color-surface-glass: rgba(0, 0, 0, 0.08);
}
```

## 🔧 Troubleshooting

### Проблемы с отображением

1. **Шрифты не загружаются**
   ```html
   <!-- Добавить font-display -->
   <link href="..." rel="stylesheet" media="print" onload="this.media='all'">
   ```

2. **Иконки не отображаются**
   ```css
   /* Проверить пути */
   .nav-icon {
       fill: currentColor;
   }
   ```

3. **Анимации не работают**
   ```css
   /* Проверить prefers-reduced-motion */
   @media (prefers-reduced-motion: reduce) {
       * {
           animation-duration: 0.01ms !important;
       }
   }
   ```

## 📈 Метрики производительности

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Bundle size**: < 50KB (без изображений)

## 🎯 Следующие шаги

1. **Интеграция с реальными данными** - подключить API эндпоинты
2. **Добавление PWA функционала** - service worker, manifest
3. **Реализация оффлайн режима** - cache API
4. **Добавление аналитики** - пользовательские события
5. **Тестирование на устройствах** - различные экраны и браузеры

---

**Создано с ❤️ для Magnum Stars**