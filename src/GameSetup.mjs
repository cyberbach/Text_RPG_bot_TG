// Настройки игры и отладки

export const DEBUG_GAME = false;                          // Общая отладка игры
export const DEBUG_SHOW_TUTORIAL_TO_NEW_PLAYER = false;   // Показывать туториал новым игрокам
export const DEBUG_NPC_CREATION = false;                  // Логирование создания NPC
export const DEBUG_ITEMS_CREATION = false;                // Логирование создания предметов

// DEBUG_*_MASS_SPAWN - спавнит сущности на ВСЕ клетки карты (для тестирования)
// DEBUG_LOG_SPAWN - логирует статистику заспавненных сущностей (без массового спавна)
export const DEBUG_MERCHANT_QUEST_MASS_SPAWN = false;     // Спавн торговцев/квестодателей на все клетки
export const DEBUG_PORTAL_MASS_SPAWN = false;              // Спавн порталов на все клетки
export const DEBUG_LOG_SPAWN = true;                      // Логирование статистики спавна (порталы, предметы, NPC)
export const DEBUG_LOG_PORTAL = false;                     // Логирование создания порталов
export const DEBUG_SHOW_MISS_REASON = false;                 // Показывать причину промаха при атаке

// Вероятности спавна сущностей (0.0 - 1.0)
export const SPAWN_CHANCES = Object.freeze({
    MONSTER: 0.3,
    MERCHANT: 0.05,
    QUEST_GIVER: 0.15,
    STORYTELLER: 0.12,
    PORTAL: 0.1,
    ITEM: 0.15,
    WEAPON: 0.12,
    MISS_REASON: 0.1,
    LIGHTNING: 0.2,
});

// Урон от молнии
export const LIGHTNING_DAMAGE = Object.freeze({
    MIN: 10,
    MAX: 25,
});

// Настройки предметов
export const ITEM_SETTINGS = Object.freeze({
    // Настройки монет (дроп с монстров)
    COINS: Object.freeze({
        MIN: 1,
        MAX: 10,
    }),

    // Настройки оружия (дроп с монстров)
    WEAPON: Object.freeze({
        MIN_DAMAGE: 1,
        MAX_DAMAGE: 4,
    }),

    // Настройки зелий лечения (дроп с монстров)
    HEALING: Object.freeze({
        HEALTH_MIN: 1,
        HEALTH_MAX: 20,
        MAX_HEALTH_MIN: 1,
        MAX_HEALTH_MAX: 30,
    }),

    // Настройки предметов на локации
    WORLD_ITEM: Object.freeze({
        WEAPON_MIN_DAMAGE: 1,
        WEAPON_MAX_DAMAGE: 8,
        HEALING_MIN: 1,
        HEALING_MAX: 10,
        MAX_HEALING_MIN: 1,
        MAX_HEALING_MAX: 10,
    }),
});

// Настройки NPC
export const NPC_SETTINGS = Object.freeze({
    // Базовые статы
    BASE_HEALTH: Object.freeze({
        MIN: 1,
        MAX: 20,
    }),
    BASE_ARMOR: 50,

    // Базовые статы атаки
    BASE_ATTACK: Object.freeze({
        MIN: 1,
        MAX: 5,
    }),
    ATTACK_RANGE: 17,

    // Множители для босса
    BOSS_HEALTH_MULTIPLIER: 10,
    BOSS_ATTACK_MULTIPLIER: 3,
    BOSS_SPAWN_RADIUS: 3,

    // Бонус атаки за уровень игрока
    ATTACK_BONUS_PER_LEVEL: Object.freeze({
        MIN: 1,
        MAX: 2,
    }),
});

// Настройки квестов
export const QUEST_SETTINGS = Object.freeze({
    // Награда монетами
    COINS_REWARD: Object.freeze({
        MIN: 5,
        MAX: 25,
    }),

    // Награда оружием
    WEAPON_REWARD: Object.freeze({
        MIN_ATTACK: 2,
        MAX_ATTACK: 10,
    }),

    // Награда зельем
    HEALING_REWARD: Object.freeze({
        HEALTH_MIN: 1,
        HEALTH_MAX: 10,
        MAX_HEALTH_MIN: 0,
        MAX_HEALTH_MAX: 20,
    }),
});

// Настройки порталов
export const PORTAL_SETTINGS = Object.freeze({
    WORLD_PORTAL_COUNT: 1,           // Количество порталов в новый мир
});

// Настройки игрока
export const PLAYER_SETTINGS = Object.freeze({
    BASE_MAX_HEALTH: 100,
    BASE_MAX_ARMOR: 100,
    BASE_MIN_ATTACK: 1,
    BASE_MAX_ATTACK: 10,
    BASE_ARMOR: 0,
    BASE_HIT_CHANCE: 80,
    HIT_CHANCE_BONUS_PER_LEVEL: 2,
    XP_BASE_MULTIPLIER: 50,
    HEALTH_BONUS_PER_LEVEL: 10,
    ATTACK_BONUS_PER_LEVEL: Object.freeze({
        MIN: 1,
        MAX: 2,
    }),
    VISIBILITY_WIDTH: 2,
    VISIBILITY_HEIGHT: 2,
});
