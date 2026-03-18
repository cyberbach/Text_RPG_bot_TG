import { DIRECTIONS } from './MovementDirections.mjs';
import { Item } from './Item.mjs';

export class Player {
    constructor() {}

    setup(worldWidth, worldHeight, name) {
        this.maxWidth = worldWidth;
        this.maxHeight = worldHeight;
        this.name = name;
    }

    clearAttributes() {
        this.maxHealth = 100;
        this.maxArmor = 100;
        this.minAttackPower = 1;
        this.maxAttackPower = 10;
        this.health = this.maxHealth;
        this.armor = 0;
        this.experience = 0; // total XP
        this.heroLevel = 1;
        this.visitedCells = new Set();
    }

    useItem(inItem) {
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

    static getXPRequiredForLevel(level) {
        // Level 1 starts at 0 XP.
        // Level 2: 100 XP, Level 3: 250 XP, ... increments are 50 * nextLevel.
        if (level <= 1) return 0;
        return 50 * ((level * (level + 1)) / 2 - 1);
    }

    getXPToNextLevel() {
        const next = this.heroLevel + 1;
        return Player.getXPRequiredForLevel(next);
    }

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

    addExperienceForAction(baseAmount) {
        // Scale XP gain with current level.
        return this.addExperience(baseAmount * this.heroLevel);
    }

    getAttackPower() {
        const min = Math.floor(this.minAttackPower);
        const max = Math.floor(this.maxAttackPower);
        const lo = Math.min(min, max);
        const hi = Math.max(min, max);
        return lo + Math.floor(Math.random() * (hi - lo + 1));
    }

    setRandomLocation() {
        this.x = Math.floor(Math.random() * this.maxWidth);
        this.y = Math.floor(Math.random() * this.maxHeight);
    }

    getPlayerDescription() {
        if (this.health > 0) {
            const healthString = ' ❤️ ' + this.health + ' / ' + this.maxHealth;
            const attackString =
                ' 🗡️ ' +
                this.minAttackPower +
                '..' +
                this.maxAttackPower;
            const xpNext = this.getXPToNextLevel();
            const xpString =
                ' ✨ ' + this.experience + ' / ' + xpNext + ' (ур. ' + this.heroLevel + ')';
            return '⭐ ' + this.name + xpString + healthString + attackString + '\n';
        } else {
            return '☠️ ' + this.name + '\n';
        }
    }

    modifyHealth(amount) {
        this.health += amount;

        //clamp from 0 to maxHealth
        this.health = Math.min(Math.max(this.health, 0), this.maxHealth);

        return this.health > 0;
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }

    getLocationCoords() {
        return '';
    }

    markCellVisited(x, y) {
        this.visitedCells.add(`${x},${y}`);
    }

    isCellVisited(x, y) {
        return this.visitedCells.has(`${x},${y}`);
    }

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
