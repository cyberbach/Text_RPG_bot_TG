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
        this.experience = 0;
        this.experienceLevel = 0;
    }

    useItem(inItem) {
        if (inItem.isWeapon) {
            this.minAttackPower += inItem.minAttackPower;
            this.maxAttackPower += inItem.maxAttackPower;
        }
        if (inItem.isHealing) {
            this.maxHealth += inItem.maxHealth;
            this.modifyHealth(inItem.health);
        }

        return 'Вы использовали ' + inItem.name + '\n';
    }

    getAttackPower() {
        return (
            this.minAttackPower +
            Math.floor(
                Math.random() * (this.minAttackPower + this.maxAttackPower)
            )
        );
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
                (this.minAttackPower + this.maxAttackPower);
            return '⭐ ' + this.name + healthString + attackString + '\n';
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
        const playerDebug = true;
        if (playerDebug) {
            return 'Позиция: X = ' + (this.x + 1) + ' / Y = ' + (this.y + 1);
        } else {
            return '';
        }
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
