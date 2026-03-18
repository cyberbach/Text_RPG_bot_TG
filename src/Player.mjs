import { DIRECTIONS } from './MovementDirections.mjs';
import { Item } from './Item.mjs';
import { STAT_EMOJI } from './SmileInText.mjs';

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
        this.maxHealth = 100;
        this.maxArmor = 100;
        this.minAttackPower = 1;
        this.maxAttackPower = 10;
        this.health = this.maxHealth;
        this.armor = 0;
        this.experience = 0;
        this.heroLevel = 1;
        this.coins = 0;
        this.hitChanceBase = 50; // Базовый шанс попадания (%)
        this.hitChanceBonusPerLevel = 2; // Бонус к шансу за каждый уровень (%)
        this.visitedCells = new Set();
    }

    // Получение текущего шанса попадания с учетом уровня и эвента
    getHitChance(eventModifier = 0) {
        return this.hitChanceBase + (this.heroLevel - 1) * this.hitChanceBonusPerLevel + eventModifier;
    }

    // Использование/подбор предмета
    useItem(inItem) {
        if (inItem.isCoin) {
            this.coins += inItem.coins;
            return 'Вы подобрали ' + inItem.coins + ' монет\n';
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

        return 'Вы использовали ' + inItem.name + '\n';
    }

    // Расчет требуемого опыта для уровня (статический метод)
    static getXPRequiredForLevel(level) {
        // Level 1 starts at 0 XP.
        // Level 2: 100 XP, Level 3: 250 XP, ... increments are 50 * nextLevel.
        if (level <= 1) return 0;
        return 50 * ((level * (level + 1)) / 2 - 1);
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
            const oldMaxHealth = this.maxHealth;
            const oldMinAttack = this.minAttackPower;
            const oldMaxAttack = this.maxAttackPower;
            
            this.heroLevel += 1;
            leveledUp = true;

            const hpBonus = (this.heroLevel - 1) * 10;
            this.maxHealth += hpBonus;
            this.health = this.maxHealth;
            this.minAttackPower += 1;
            this.maxAttackPower += 2;

            statsGained = {
                hpBonus,
                minAttackBonus: 1,
                maxAttackBonus: 2,
                newLevel: this.heroLevel
            };
        }

        return { gained: add, leveledUp, statsGained };
    }

    // Добавление опыта за действие (с учетом уровня)
    addExperienceForAction(baseAmount) {
        // Scale XP gain with current level.
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

    // Получение описания игрока (для отображения в сообщении)
    getPlayerDescription() {
        if (this.health > 0) {
            const healthString = ' ' + STAT_EMOJI.HEALTH + ' ' + this.health + ' / ' + this.maxHealth;
            const attackString =
                ' ' + STAT_EMOJI.ATTACK + ' ' +
                this.minAttackPower +
                '..' +
                this.maxAttackPower;
            const xpNext = this.getXPToNextLevel();
            const xpString =
                ' ' + STAT_EMOJI.EXPERIENCE + ' ' + this.experience + ' / ' + xpNext + ' (ур. ' + this.heroLevel + ')';
            const coinsString = this.coins > 0 ? ' ' + STAT_EMOJI.COINS + ' ' + this.coins : '';
            return STAT_EMOJI.LEVEL + ' ' + this.name + xpString + healthString + attackString + coinsString + '\n';
        } else {
            return STAT_EMOJI.DEAD + ' ' + this.name + '\n';
        }
    }

    // Изменение здоровья (положительное - лечение, отрицательное - урон)
    modifyHealth(amount) {
        this.health += amount;

        //clamp from 0 to maxHealth
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
            case DIRECTIONS.UP:
                if (this.y > 0) {
                    this.y--;
                    return true;
                }
                break;
            case DIRECTIONS.DOWN:
                if (this.y < this.maxHeight - 1) {
                    this.y++;
                    return true;
                }
                break;
            case DIRECTIONS.LEFT:
                if (this.x > 0) {
                    this.x--;
                    return true;
                }
                break;
            case DIRECTIONS.RIGHT:
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
