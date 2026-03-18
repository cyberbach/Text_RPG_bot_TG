# Text_RPG_bot_TG
![Скриншот игры](TextRPGbotTG.png)

Текстовая RPG (MUD‑подобная) в Telegram: исследуйте процедурно сгенерированный мир, сражайтесь с монстрами, собирайте предметы, выполняйте квесты и прокачивайте героя.

![node](https://img.shields.io/badge/Node.js-000?style=flat&logo=node.js&logoColor=white)
![telegram](https://img.shields.io/badge/Telegram%20Bot-000?style=flat&logo=telegram&logoColor=white)
![dotenv](https://img.shields.io/badge/dotenv-000?style=flat&logo=dotenv&logoColor=white)
![nodemon](https://img.shields.io/badge/nodemon-000?style=flat&logo=nodemon&logoColor=white)

## Описание игры
- **Контент**: 134 предмета (100 оружий + 34 лечебных), 55 видов монстров, 10 типов локаций
- **NPC**: торговцы (покупка предметов), квестодатели (выполнение квестов за награду)
- **Порталы**: телепортация по миру и переход в новые миры
- **Погода**: влияет на шанс попадания при атаке
- **Статистика**: отслеживание прогресса игрока и глобальной статистики
- **Цель**: выжить, исследуя мир, и найти что‑нибудь ценное, пока монстры не нашли вас первыми

## Запуск (Windows)

```bash
npm install
```

Откройте `.env` и укажите токен бота:

```env
BOT_TOKEN=ВАШ_ТОКЕН_ИЗ_BOTFATHER
```

```bash
npm run dev
```

## Структура проекта

```
src/
├── bot.mjs                 # Основной файл бота
├── Game.mjs                # Игровая логика (атака, урон)
├── EventSystem.mjs         # Система погоды и событий
├── GameSetup.mjs           # Конфигурация и настройки
├── Item.mjs                # Класс предметов
├── MovementDirections.mjs   # Направления движения
├── NPC.mjs                 # Класс NPC (монстры, торговцы, квестодатели)
├── Player.mjs              # Класс игрока
├── Portal.mjs              # Класс порталов
├── TelegramAPIConstants.mjs # Константы Telegram API
├── World.mjs               # Генерация мира
├── LocationTypes.mjs       # Типы локаций
└── TextEnums/              # Текстовые константы и enum'ы
    ├── AdjectiveWords.mjs    # Прилагательные для имен
    ├── CharacterNames.mjs    # Имена персонажей
    ├── HealItemNames.mjs     # Названия лечебных предметов
    ├── LocationDescriptions.mjs # Описания локаций
    ├── MonsterNames.mjs       # Названия монстров
    ├── SmileInText.mjs        # Emoji константы
    ├── StatTextLabels.mjs     # Текстовые метки статов
    └── WorldNames.mjs         # Названия миров
```

## Настройки (GameSetup.mjs)

### Режимы отладки
```javascript
DEBUG_GAME = false           // Общий дебаг
DEBUG_NPC_CREATION = false   // Логирование создания NPC
DEBUG_ITEMS_CREATION = false // Логирование создания предметов
DEBUG_MERCHANT_QUEST_SPAWN = false // Спавн торговцев/квестов на все клетки
DEBUG_PORTAL = false         // Логирование порталов
DEBUG_PORTAL_SPAWN = false  // Спавн порталов на все клетки
```

### Вероятности спавна (0.0 - 1.0)
```javascript
SPAWN_CHANCES = {
    MONSTER: 0.4,       // Монстры
    MERCHANT: 0.15,      // Торговцы
    QUEST_GIVER: 0.15,  // Квестодатели
    PORTAL: 0.1,        // Порталы
}
```

### PORTAL_SETTINGS
```javascript
PORTAL_SETTINGS = {
    WORLD_PORTAL_COUNT: 1,  // Количество порталов в новый мир
}
```

### PLAYER_SETTINGS
```javascript
PLAYER_SETTINGS = {
    BASE_MAX_HEALTH: 100,
    BASE_MIN_ATTACK: 1,
    BASE_MAX_ATTACK: 10,
    BASE_HIT_CHANCE: 50,
    HIT_CHANCE_BONUS_PER_LEVEL: 2,
    XP_BASE_MULTIPLIER: 50,
    HEALTH_BONUS_PER_LEVEL: 10,
    ATTACK_BONUS_PER_LEVEL: { MIN: 1, MAX: 2 },
}
```

### NPC_SETTINGS
```javascript
NPC_SETTINGS = {
    BASE_HEALTH: { MIN: 1, MAX: 100 },
    BASE_ARMOR: 50,
    BASE_ATTACK: { MIN: 1, MAX: 5 },
    ATTACK_RANGE: 17,
}
```

### ITEM_SETTINGS
```javascript
ITEM_SETTINGS = {
    COINS: { MIN: 1, MAX: 10 },
    WEAPON: { MIN_DAMAGE: 1, MAX_DAMAGE: 4 },
    HEALING: { HEALTH_MIN: 1, HEALTH_MAX: 20 },
    WORLD_ITEM: { /* предметы на локации */ },
}
```

## Механики

### Бой
- Порядок хода: NPC атакует первым → если игрок выжил → игрок атакует
- Шанс попадания: базовый 50% + 2% за каждый уровень
- Урон: случайное значение между мин и макс атакой

### Опыт и уровни
- За каждое действие (шаг, подбор предмета) начисляется опыт
- Опыт зависит от уровня героя
- За портал начисляется 50% от требуемого опыта для следующего уровня

### Погода (EventSystem)
- Солнечно: +10% точности
- Облачно: без изменений
- Дождливо: -10% точности
- Туман: -15% точности
- Гроза: -5% точности
- Погода меняется каждые 3-7 ходов

### Порталы
- **Обычный портал**: телепортирует в случайную точку текущего мира (+50% XP для следующего уровня)
- **Портал в иной мир**: создает новый мир с новой картой

### Торговцы
- Продают случайный предмет за монеты
- Цена: 10-30 монет
- После покупки становятся мирными

### Квестодатели
- 70% шанс успешного выполнения квеста
- 30% шанс что NPC разозлится и нападет
- Награда: монеты или предмет (оружие/зелье)

## Статистика

### Отслеживается:
- Игр начато/завершено
- Нанесено/получено урона
- Убито монстров
- Найдено/куплено предметов
- Выполнено квестов
- Использовано порталов
- Смертей
- Монет

## Горячие клавиши

- `/start` - начать новую игру
- `/stats` - статистика
