# UI Компоненты

Этот каталог содержит переиспользуемые UI компоненты для Magnum Star WebApp.

## Компоненты

### StatsCard
Карточка для отображения статистики с иконкой, значением и описанием.

```tsx
<StatsCard
  title="Magnum Coins"
  value="1,234"
  description="Валюта игры"
  icon={<Coins className="w-6 h-6" />}
  progress={75} // опционально
/>
```

### AchievementBadge
Компонент для отображения достижений с прогрессом.

```tsx
<AchievementBadge
  title="Первый клик"
  description="Сделайте свой первый клик"
  icon={<Target className="w-5 h-5" />}
  isUnlocked={true}
  progress={1}
  maxProgress={1}
/>
```

### CaseCard
Карточка для отображения кейсов в магазине.

```tsx
<CaseCard
  name="Базовый кейс"
  price={100}
  description="Простой кейс с базовыми наградами"
  image="📦"
  isAvailable={true}
  onOpen={() => console.log('Opening case')}
/>
```

### LevelProgress
Компонент для отображения прогресса уровня игрока.

```tsx
<LevelProgress
  level={5}
  experience={250}
  experienceToNext={500}
/>
```

### Analytics
Простой компонент для аналитики (невидимый).

```tsx
<Analytics />
```

## Использование

Все компоненты оптимизированы для мобильных устройств и поддерживают:
- Темную тему
- Адаптивный дизайн
- Touch-оптимизацию
- Hardware acceleration
- Анимации и переходы

## Стилизация

Компоненты используют Tailwind CSS классы и поддерживают:
- `className` prop для дополнительных стилей
- Темную тему через `dark:` префиксы
- Мобильные оптимизации через кастомные классы
