# Text_RPG_bot_TG

Текстовая RPG (MUD‑подобная) в Telegram: исследуйте процедурно сгенерированный мир, сражайтесь с монстрами, собирайте предметы, выполняйте квесты, разгадывайте загадки и прокачивайте героя.

![node](https://img.shields.io/badge/Node.js-000?style=flat&logo=node.js&logoColor=white)
![telegram](https://img.shields.io/badge/Telegram%20Bot-000?style=flat&logo=telegram&logoColor=white)
![dotenv](https://img.shields.io/badge/dotenv-000?style=flat&logo=dotenv&logoColor=white)
![nodemon](https://img.shields.io/badge/nodemon-000?style=flat&logo=nodemon&logoColor=white)

![Скриншот игры](TextRPGbotTG.png)

## Запуск

```bash
npm install
```

Создайте файл `.env` с токеном бота:

```env
BOT_TOKEN=ВАШ_ТОКЕН_ИЗ_BOTFATHER
```

```bash
npm run dev
```

## Структура проекта

```
src/
├── bot.mjs                    # Основной файл бота
├── Game.mjs                   # Игровая логика (атака, урон)
├── EventSystem.mjs            # Система погоды и событий
├── GameSetup.mjs              # Конфигурация и настройки
├── Item.mjs                   # Класс предметов
├── MovementDirections.mjs      # Направления движения
├── NPC.mjs                    # Класс NPC
├── Player.mjs                 # Класс игрока
├── Portal.mjs                 # Класс порталов
├── TelegramAPIConstants.mjs    # Константы Telegram API
├── TelegramButtons.mjs         # Генерация кнопок
├── World.mjs                  # Генерация мира
├── LocationTypes.mjs           # Типы локаций
│
├── handlers/                  # Обработчики действий игрока
│   ├── index.mjs              # Экспорт всех handlers
│   ├── MovementHandler.mjs     # Движение
│   ├── CombatHandler.mjs      # Бой
│   ├── ItemHandler.mjs        # Подбор предметов
│   ├── TradeHandler.mjs       # Торговля и квесты
│   └── PortalHandler.mjs      # Порталы
│
└── TextEnums/                 # Текстовые константы
    ├── AdjectiveWords.mjs
    ├── CharacterNames.mjs
    ├── HealItemNames.mjs
    ├── ItemTextLabels.mjs
    ├── LocationDescriptions.mjs
    ├── MonsterNames.mjs
    ├── NPCTextLabels.mjs
    ├── SmileInText.mjs
    ├── StatTextLabels.mjs
    └── WorldNames.mjs
```

## Команды бота

- `/start` — начать новую игру (мобильная версия)
- `/pc` — начать новую игру (версия для ПК, большая карта)
- `/help` — помощь
- `/info` — статистика

## Управление

Кнопки в Telegram:
- **Движение**: Север, Юг, Запад, Восток
- **Действия**: Атака, Взять, Взять все, Купить, Помочь, Портал, Головоломка

## Особенности

### Персонажи на карте

**Агрессивные монстры** - нападают на игрока. При убийстве выпадают монеты и опыт.

**Торговцы** - продают случайные предметы за монеты.

**Квестодатели** - просят о помощи. Могут дать награду или напасть.

**Сказочники** - загадывают загадки. За правильные ответы - опыт.

**Боссы** - особо сильные монстры рядом с порталами. Оставляют легендарный дроп (оружие, зелья или монеты).

### Порталы

**Обычные порталы** (@) - телепортируют в случайную точку мира.

**Порталы в новый мир** - генерируют новый мир с боссом.
