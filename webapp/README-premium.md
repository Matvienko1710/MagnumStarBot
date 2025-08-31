# Magnum Stars - Premium Fintech WebApp

## 🚀 Обзор

Современное мобильное веб-приложение в стиле Revolut, Monobank и Binance с премиум-дизайном и отличным UX.

## ✨ Особенности

- 🎨 **Премиум дизайн**: Glassmorphism, темная тема, плавные анимации
- 📱 **Mobile-first**: Оптимизировано для мобильных устройств
- ♿ **Доступность**: WCAG AA compliance, keyboard navigation
- 🎯 **Touch-friendly**: Все интерактивные элементы >= 48px
- 🌙 **Темы**: Темная/светлая тема с автоматическим переключением
- ⚡ **Производительность**: CSS-only эффекты, оптимизированные assets

## 📁 Структура проекта

```
webapp/
├── index.html          # Основная разметка
├── styles.css          # Стили с CSS-переменными
├── assets/
│   └── icons/          # SVG иконки
│       ├── star.svg
│       ├── coin.svg
│       ├── home.svg
│       ├── tasks.svg
│       ├── earn.svg
│       ├── profile.svg
│       ├── exchange.svg
│       ├── mining.svg
│       ├── referral.svg
│       ├── daily.svg
│       └── settings.svg
└── README.md          # Эта документация
```

## 🎨 Дизайн-система

### CSS Переменные

```css
:root {
  /* Цвета */
  --color-bg-primary: #0f172a;
  --color-bg-secondary: #1e293b;
  --color-accent-primary: #3b82f6;
  --color-accent-secondary: #facc15;

  /* Типографика */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-2xl: 1.5rem;

  /* Пространство */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;

  /* Радиусы */
  --radius-sm: 0.375rem;
  --radius-base: 0.5rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-full: 9999px;

  /* Тени */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}
```

### Компоненты

#### User Card
```html
<div class="user-card">
  <div class="user-info">
    <div class="user-avatar" id="user-avatar">
      <span id="user-initials">U</span>
    </div>
    <div class="user-details">
      <h1 id="user-name">Пользователь</h1>
      <p id="user-id">ID: 123456789</p>
    </div>
  </div>
</div>
```

#### Balance Cards
```html
<div class="balance-grid">
  <div class="balance-card" tabindex="0" role="button" aria-label="Баланс звезд">
    <svg class="balance-icon">...</svg>
    <div class="balance-label">Звезды</div>
    <div class="balance-amount" id="stars-balance">0</div>
  </div>
  <div class="balance-card coins" tabindex="0" role="button" aria-label="Баланс монет">
    <svg class="balance-icon">...</svg>
    <div class="balance-label">Монеты</div>
    <div class="balance-amount" id="coins-balance">0</div>
  </div>
</div>
```

#### Main CTA Button
```html
<div class="cta-section">
  <button class="main-cta" id="click-button" aria-label="Кликнуть для заработка монет">
    <svg class="main-cta-icon">...</svg>
  </button>
  <div class="cta-content">
    <h2 class="cta-title">Заработай монеты</h2>
    <p class="cta-subtitle">Нажимай на кнопку и получай награды</p>
  </div>
</div>
```

#### Navigation
```html
<nav class="bottom-nav" role="navigation" aria-label="Основная навигация">
  <div class="bottom-nav-content">
    <a href="#" class="nav-item active" data-page="home" aria-label="Главная страница">
      <svg class="nav-icon">...</svg>
      <span class="nav-label">Главная</span>
    </a>
    <!-- ... другие пункты ... -->
  </div>
</nav>
```

## 🔧 Настройка и интеграция

### 1. Подключение Telegram WebApp

```javascript
// Инициализация Telegram WebApp
function initializeTelegramWebApp() {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // Получение данных пользователя
    if (tg.initDataUnsafe?.user) {
      appState.updateUser(tg.initDataUnsafe.user);
      loadUserData(tg.initDataUnsafe.user.id);
    }
  }
}
```

### 2. API интеграция

#### Загрузка данных пользователя
```javascript
async function loadUserData(userId) {
  try {
    // Загрузка баланса
    const balanceResponse = await fetch(`/api/user/balance/${userId}`);
    const balanceData = await balanceResponse.json();
    appState.updateBalances(balanceData.balance);

    // Загрузка статистики
    const statsResponse = await fetch(`/api/user/stats/${userId}`);
    const statsData = await statsResponse.json();
    appState.updateStats(statsData.stats);
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}
```

#### Обработка клика
```javascript
async function handleClick() {
  const response = await fetch(`/api/user/click/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (response.ok) {
    const data = await response.json();
    appState.updateBalances(data.balance);
    appState.showToast('+1 монета!', 'success');
  }
}
```

### 3. Темизация

#### Переключение темы
```javascript
// Автоматическое определение темы
if (window.Telegram?.WebApp?.colorScheme) {
  document.documentElement.setAttribute('data-theme', tg.colorScheme);
}

// Ручное переключение
document.documentElement.setAttribute('data-theme', 'light'); // или 'dark'
```

### 4. Кастомизация цветов

```css
:root {
  /* Измените эти переменные для кастомизации */
  --color-accent-primary: #your-color;
  --color-accent-secondary: #your-color;
  --color-bg-primary: #your-color;

  /* Или используйте готовые пресеты */
  --color-accent-primary: #10b981; /* Зеленый */
  --color-accent-primary: #8b5cf6; /* Фиолетовый */
}
```

## 📱 Адаптивность

### Breakpoints
```css
/* Mobile-first подход */
.container { max-width: 480px; }

/* Tablet */
@media (min-width: 768px) {
  .container { max-width: 640px; }
  .earn-grid { grid-template-columns: 1fr 1fr; }
}

/* Desktop */
@media (min-width: 1024px) {
  .container { max-width: 768px; }
}
```

### Safe Area (для iPhone X+)
```css
.container {
  padding-top: calc(var(--spacing-4) + env(safe-area-inset-top, 0));
}

.bottom-nav {
  padding-bottom: calc(var(--spacing-3) + env(safe-area-inset-bottom, 0));
}
```

## ♿ Доступность

### ARIA атрибуты
```html
<!-- Правильные метки для кнопок -->
<button aria-label="Кликнуть для заработка монет">...</button>

<!-- Навигация -->
<nav role="navigation" aria-label="Основная навигация">...</nav>

<!-- Модальные окна -->
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">...</div>
```

### Keyboard Navigation
```css
/* Focus visible для клавиатурной навигации */
.nav-item:focus-visible,
.main-cta:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}
```

### Touch Targets
```css
/* Минимальный размер touch targets */
.nav-item,
.main-cta,
.balance-card {
  min-height: 48px;
  min-width: 48px;
}
```

## 🎭 Состояния компонентов

### Loading
```html
<div class="balance-amount loading">
  <span class="loading">Загрузка...</span>
</div>
```

### Error
```html
<div class="error-state">
  <div class="error">
    <p>❌ Ошибка загрузки данных. Попробуйте позже.</p>
  </div>
</div>
```

### Empty
```html
<div class="empty-state">
  <svg class="empty-state-icon">...</svg>
  <h3 class="empty-state-title">Нет доступных заданий</h3>
  <p class="empty-state-text">Проверь позже, новые задания появятся скоро</p>
</div>
```

## 🚀 Деплоймент

### Render
1. Создайте новый сервис на Render
2. Подключите GitHub репозиторий
3. Настройте переменные окружения:
   ```
   NODE_ENV=production
   TELEGRAM_BOT_TOKEN=your_bot_token
   DATABASE_URL=your_database_url
   ```

### Оптимизация для продакшена
```javascript
// Service Worker для кеширования
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

## 🔧 Разработка

### Локальная разработка
```bash
# Установка зависимостей
npm install

# Запуск dev сервера
npm run dev

# Сборка для продакшена
npm run build
```

### Структура файлов
```
src/
├── components/     # Компоненты
├── pages/         # Страницы
├── styles/        # Стили
└── utils/         # Утилиты
```

## 📊 Производительность

### Метрики
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Total Blocking Time**: < 200ms

### Оптимизации
- CSS-in-JS для critical CSS
- WebP изображения с fallbacks
- Font loading optimization
- Service Worker для кеширования

## 🐛 Troubleshooting

### Распространенные проблемы

#### 1. Шрифты не загружаются
```css
/* Fallback шрифты */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

#### 2. Safe Area не работает
```css
/* Проверьте поддержку */
@supports (padding: max(0px)) {
  .container {
    padding-top: max(var(--spacing-4), env(safe-area-inset-top));
  }
}
```

#### 3. Анимации дергаются
```css
/* Используйте transform и opacity */
.element {
  transform: translateY(0);
  transition: transform 0.3s ease;
}
```

## 📝 Лицензия

MIT License - свободно используйте в коммерческих и личных проектах.

## 🤝 Вклад в развитие

1. Fork репозиторий
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Создайте Pull Request

## 📞 Поддержка

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Telegram**: [@your_support_bot](https://t.me/your_support_bot)
- **Email**: support@magnumstars.app

---

*Создано с ❤️ для Telegram Web Apps*