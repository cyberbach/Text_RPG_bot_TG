import { AdjectiveWords } from './TextEnums/AdjectiveWords.mjs';
import { STAT_EMOJI } from './TextEnums/SmileInText.mjs';
import { PLAYER_SETTINGS } from './GameSetup.mjs';

const PLAYER_TEXT = {
    PICKED_COINS: 'Вы подобрали ',
    PICKED_ITEM: 'Вы подобрали ',
    COINS_SUFFIX: ' монет\n',
    ITEM_SUFFIX: '\n',
    LEVEL_PREFIX: ' (ур. ',
    LEVEL_SUFFIX: ')',
    DIVIDER: ' / ',
    NO_BONUS: '+0',
};

export class Player {
    constructor() {}

    // Настройка параметров мира и имени игрока
    setup(worldWidth, worldHeight, name) {
        this.maxWidth = worldWidth;
        this.maxHeight = worldHeight;
        this.name = name;
    }

    // Сброс атрибутов при старте новой игры
    clearAttributes() {
        const { BASE_MAX_HEALTH, BASE_MAX_ARMOR, BASE_MIN_ATTACK, BASE_MAX_ATTACK, BASE_ARMOR, BASE_HIT_CHANCE, HIT_CHANCE_BONUS_PER_LEVEL } = PLAYER_SETTINGS;
        
        this.maxHealth = BASE_MAX_HEALTH;
        this.maxArmor = BASE_MAX_ARMOR;
        this.minAttackPower = BASE_MIN_ATTACK;
        this.maxAttackPower = BASE_MAX_ATTACK;
        this.health = this.maxHealth;
        this.armor = BASE_ARMOR;
        this.experience = 0;
        this.heroLevel = 1;
        this.coins = 0;
        this.hitChanceBase = BASE_HIT_CHANCE;
        this.hitChanceBonusPerLevel = HIT_CHANCE_BONUS_PER_LEVEL;
        this.visitedCells = new Set();
    }

    // Получение текущего шанса попадания с учетом уровня и эвента
    getHitChance(eventModifier = 0) {
        return this.hitChanceBase + (this.heroLevel - 1) * this.hitChanceBonusPerLevel + eventModifier;
    }

    // Использование/подбор предмета
    useItem(inItem) {
        let coinsGained = 0;
        
        if (inItem.isCoin) {
            this.coins += inItem.coins;
            coinsGained = inItem.coins;
            return { text: PLAYER_TEXT.PICKED_COINS + inItem.coins + PLAYER_TEXT.COINS_SUFFIX, coinsGained };
        }
        if (inItem.isWeapon) {
            this.minAttackPower += inItem.minAttackPower;
            this.maxAttackPower += inItem.maxAttackPower;
            if (this.minAttackPower > this.maxAttackPower) {
                this.maxAttackPower = this.minAttackPower;
            }
        }
        if (inItem.isHealing) {
            this.maxHealth += inItem.maxHealth;
            this.modifyHealth(inItem.health);
        }

        return { text: PLAYER_TEXT.PICKED_ITEM + inItem.name + PLAYER_TEXT.ITEM_SUFFIX, coinsGained };
    }

    // Расчет требуемого опыта для уровня (статический метод)
    static getXPRequiredForLevel(level) {
        if (level <= 1) return 0;
        return PLAYER_SETTINGS.XP_BASE_MULTIPLIER * ((level * (level + 1)) / 2 - 1);
    }

    // Получение опыта для следующего уровня
    getXPToNextLevel() {
        const next = this.heroLevel + 1;
        return Player.getXPRequiredForLevel(next);
    }

    // Добавление опыта и повышение уровня
    addExperience(amount) {
        const add = Math.max(0, Math.floor(amount));
        if (add === 0) return { gained: 0, leveledUp: false, statsGained: null };

        this.experience += add;
        let leveledUp = false;
        let statsGained = null;

        while (this.experience >= this.getXPToNextLevel()) {
            const hpBonus = (this.heroLevel - 1) * PLAYER_SETTINGS.HEALTH_BONUS_PER_LEVEL;
            this.heroLevel += 1;
            leveledUp = true;

            this.maxHealth += hpBonus;
            this.health = this.maxHealth;
            this.minAttackPower += PLAYER_SETTINGS.ATTACK_BONUS_PER_LEVEL.MIN;
            this.maxAttackPower += PLAYER_SETTINGS.ATTACK_BONUS_PER_LEVEL.MAX;

            statsGained = {
                hpBonus,
                minAttackBonus: PLAYER_SETTINGS.ATTACK_BONUS_PER_LEVEL.MIN,
                maxAttackBonus: PLAYER_SETTINGS.ATTACK_BONUS_PER_LEVEL.MAX,
                newLevel: this.heroLevel
            };
        }

        return { gained: add, leveledUp, statsGained };
    }

    // Добавление опыта за действие (с учетом уровня)
    addExperienceForAction(baseAmount) {
        return this.addExperience(baseAmount * this.heroLevel);
    }

    // Получение случайного значения атаки в диапазоне
    getAttackPower() {
        const min = Math.floor(this.minAttackPower);
        const max = Math.floor(this.maxAttackPower);
        const lo = Math.min(min, max);
        const hi = Math.max(min, max);
        return lo + Math.floor(Math.random() * (hi - lo + 1));
    }

    // Установка случайной позиции на карте
    setRandomLocation() {
        this.x = Math.floor(Math.random() * this.maxWidth);
        this.y = Math.floor(Math.random() * this.maxHeight);
    }

    // Установка позиции на карте
    setPosition(newX, newY) {
        this.x = newX;
        this.y = newY;
    }

    // Получение описания игрока (для отображения в сообщении)
    getPlayerDescription() {
        if (this.health > 0) {
            const healthString = PLAYER_TEXT.DIVIDER + STAT_EMOJI.HEALTH + ' ' + this.health + PLAYER_TEXT.DIVIDER + this.maxHealth;
            const attackString = STAT_EMOJI.ATTACK + ' ' + this.minAttackPower + '..' + this.maxAttackPower;
            const xpNext = this.getXPToNextLevel();
            const xpString = STAT_EMOJI.EXPERIENCE + ' ' + this.experience + PLAYER_TEXT.DIVIDER + xpNext + PLAYER_TEXT.LEVEL_PREFIX + this.heroLevel + PLAYER_TEXT.LEVEL_SUFFIX;
            const coinsString = this.coins > 0 ? ' ' + STAT_EMOJI.COINS + ' ' + this.coins : '';
            return STAT_EMOJI.LEVEL + ' ' + this.name + xpString + healthString + attackString + coinsString + '\n';
        } else {
            return STAT_EMOJI.DEAD + ' ' + this.name + '\n';
        }
    }

    // Изменение здоровья (положительное - лечение, отрицательное - урон)
    modifyHealth(amount) {
        this.health += amount;
        this.health = Math.min(Math.max(this.health, 0), this.maxHealth);
        return this.health > 0;
    }

    // Получение координаты X
    getX() {
        return this.x;
    }

    // Получение координаты Y
    getY() {
        return this.y;
    }

    // Получение строки с координатами
    getLocationCoords() {
        return '';
    }

    // Отметить клетку как посещенную
    markCellVisited(x, y) {
        this.visitedCells.add(`${x},${y}`);
    }

    // Проверка посещения клетки
    isCellVisited(x, y) {
        return this.visitedCells.has(`${x},${y}`);
    }

    // Перемещение игрока в направлении
    move(direction) {
        switch (direction) {
            case 'up':
                if (this.y > 0) {
                    this.y--;
                    return true;
                }
                break;
            case 'down':
                if (this.y < this.maxHeight - 1) {
                    this.y++;
                    return true;
                }
                break;
            case 'left':
                if (this.x > 0) {
                    this.x--;
                    return true;
                }
                break;
            case 'right':
                if (this.x < this.maxWidth - 1) {
                    this.x++;
                    return true;
                }
                break;
            default:
                break;
        }
        return false;
    }
}
