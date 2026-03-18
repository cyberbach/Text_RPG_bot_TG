// Настройки игры и отладки

export const DEBUG_GAME = false;
export const DEBUG_NPC_CREATION = false;
export const DEBUG_ITEMS_CREATION = false;
export const DEBUG_MERCHANT_QUEST_SPAWN = false;
export const DEBUG_PORTAL = false;
export const DEBUG_PORTAL_SPAWN = false; // Спавн порталов на все клетки (для тестирования)

// Вероятности спавна сущностей (0.0 - 1.0)
export const SPAWN_CHANCES = Object.freeze({
    MONSTER: 0.4,
    MERCHANT: 0.15,
    QUEST_GIVER: 0.15,
    PORTAL: 0.1,
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
        MAX_HEALING_MIN: 0,
        MAX_HEALING_MAX: 10,
    }),
});

// Настройки NPC
export const NPC_SETTINGS = Object.freeze({
    // Базовые статы
    BASE_HEALTH: Object.freeze({
        MIN: 1,
        MAX: 100,
    }),
    BASE_ARMOR: 50,

    // Базовые статы атаки
    BASE_ATTACK: Object.freeze({
        MIN: 1,
        MAX: 5,
    }),
    ATTACK_RANGE: 17,

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
    BASE_HIT_CHANCE: 50,
    HIT_CHANCE_BONUS_PER_LEVEL: 2,
    XP_BASE_MULTIPLIER: 50,
    HEALTH_BONUS_PER_LEVEL: 10,
    ATTACK_BONUS_PER_LEVEL: Object.freeze({
        MIN: 1,
        MAX: 2,
    }),
});

// Текстовые константы для NPC
export const NPC_TEXT = Object.freeze({
    MERCHANT_ASKING: 'продавец просит ',
    MONET_SUFFIX: ' монет)',
    QUEST_NEED_HELP: 'просит помочь)',
    PEACEFUL: 'мирный)',
});

// Текстовые константы для предметов
export const ITEM_TEXT = Object.freeze({
    COIN_NAMES: Object.freeze({
        ONE: 'Монета',
        FEW: 'Монеты',
        MANY: 'Монет',
    }),
    PREFIX: '- ',
    SEPARATOR: ' ',
    NO_BONUS: '+0',
});
