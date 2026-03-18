import { AdjectiveWords } from './TextEnums/AdjectiveWords.mjs';
import { STAT_TEXT_LABELS } from './TextEnums/StatTextLabels.mjs';
import { STAT_EMOJI } from './TextEnums/SmileInText.mjs';
import { WeaponNames } from './TextEnums/WeaponNames.mjs';
import { HealItemNames } from './TextEnums/HealItemNames.mjs';
import { DEBUG_ITEMS_CREATION, ITEM_SETTINGS } from './GameSetup.mjs';
import { ITEM_TEXT } from './TextEnums/ItemTextLabels.mjs';

export class Item {
    constructor() {
        this.health = 0;
        this.maxHealth = 0;
        this.minAttackPower = 0;
        this.maxAttackPower = 0;
        this.isHealing = false;
        this.isWeapon = false;
        this.isCoin = false;
        this.coins = 0;
        this.name = '';
    }

    setup(worldWidth, worldHeight, excludeX, excludeY) {
        this.x = Math.floor(Math.random() * worldWidth);
        this.y = Math.floor(Math.random() * worldHeight);

        if (this.x === excludeX && this.y === excludeY) {
            this.x = Math.floor(Math.random() * worldWidth);
            this.y = Math.floor(Math.random() * worldHeight);
        }

        if (Math.random() > 0.5) {
            this.isHealing = false;
            this.isWeapon = true;
            const baseNames = Object.values(WeaponNames);
            this.name = baseNames[Math.floor(Math.random() * baseNames.length)];
            
            const { WEAPON_MIN_DAMAGE, WEAPON_MAX_DAMAGE } = ITEM_SETTINGS.WORLD_ITEM;
            const damageType = Math.floor(Math.random() * 3);
            if (damageType === 0) {
                this.minAttackPower = WEAPON_MIN_DAMAGE + Math.floor(Math.random() * WEAPON_MAX_DAMAGE);
                this.maxAttackPower = 0;
            } else if (damageType === 1) {
                this.minAttackPower = 0;
                this.maxAttackPower = WEAPON_MIN_DAMAGE + Math.floor(Math.random() * WEAPON_MAX_DAMAGE * 2);
            } else {
                this.minAttackPower = WEAPON_MIN_DAMAGE + Math.floor(Math.random() * WEAPON_MAX_DAMAGE);
                this.maxAttackPower = this.minAttackPower + Math.floor(Math.random() * WEAPON_MAX_DAMAGE);
            }
        } else {
            this.isHealing = true;
            this.isWeapon = false;
            const baseNames = Object.values(HealItemNames);
            this.name = baseNames[Math.floor(Math.random() * baseNames.length)];
            if (Math.random() > 0.3) {
                const { HEALING_MIN, HEALING_MAX } = ITEM_SETTINGS.WORLD_ITEM;
                this.health = HEALING_MIN + Math.floor(Math.random() * HEALING_MAX);
            } else {
                const { MAX_HEALING_MIN, MAX_HEALING_MAX } = ITEM_SETTINGS.WORLD_ITEM;
                this.maxHealth = MAX_HEALING_MIN + Math.floor(Math.random() * MAX_HEALING_MAX);
            }
        }

        if (DEBUG_ITEMS_CREATION) {
            console.log('Created Item:', this.name, ' at ', this.x, '/', this.y);
        }
    }

    setupAtLocation(a, b) {
        this.x = a;
        this.y = b;
        
        const coinChance = Math.random();
        if (coinChance < 0.3) {
            this.isCoin = true;
            const { MIN, MAX } = ITEM_SETTINGS.COINS;
            this.coins = MIN + Math.floor(Math.random() * MAX);
            
            const lastDigit = this.coins % 10;
            const lastTwoDigits = this.coins % 100;
            if (lastDigit === 1 && lastTwoDigits !== 11) {
                this.name = ITEM_TEXT.COIN_NAMES.ONE;
            } else if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
                this.name = ITEM_TEXT.COIN_NAMES.FEW;
            } else {
                this.name = ITEM_TEXT.COIN_NAMES.MANY;
            }
            return;
        }

        if (Math.random() > 0.5) {
            this.isHealing = false;
            this.isWeapon = true;
            const baseNames = Object.values(WeaponNames);
            this.name = baseNames[Math.floor(Math.random() * baseNames.length)];
            
            const { MIN_DAMAGE, MAX_DAMAGE } = ITEM_SETTINGS.WEAPON;
            const damageType = Math.floor(Math.random() * 3);
            if (damageType === 0) {
                this.minAttackPower = MIN_DAMAGE + Math.floor(Math.random() * MAX_DAMAGE);
                this.maxAttackPower = 0;
            } else if (damageType === 1) {
                this.minAttackPower = 0;
                this.maxAttackPower = MIN_DAMAGE + Math.floor(Math.random() * MAX_DAMAGE * 2);
            } else {
                this.minAttackPower = MIN_DAMAGE + Math.floor(Math.random() * MAX_DAMAGE);
                this.maxAttackPower = this.minAttackPower + Math.floor(Math.random() * MAX_DAMAGE);
            }
        } else {
            this.isHealing = true;
            this.isWeapon = false;
            const baseNames = Object.values(HealItemNames);
            this.name = baseNames[Math.floor(Math.random() * baseNames.length)];
            if (Math.random() > 0.5) {
                const { HEALTH_MIN, HEALTH_MAX } = ITEM_SETTINGS.HEALING;
                this.health = HEALTH_MIN + Math.floor(Math.random() * HEALTH_MAX);
            } else {
                const { MAX_HEALTH_MIN, MAX_HEALTH_MAX } = ITEM_SETTINGS.HEALING;
                this.maxHealth = MAX_HEALTH_MIN + Math.floor(Math.random() * MAX_HEALTH_MAX);
            }
        }

        if (DEBUG_ITEMS_CREATION) {
            console.log('Created Item:', this.name, ' at ', this.x, '/', this.y);
        }
    }

    getItemDescription() {
        let descriptionString = ITEM_TEXT.PREFIX + this.name + ITEM_TEXT.SEPARATOR;
        if (this.isCoin) {
            descriptionString += STAT_EMOJI.COINS + ' ' + this.coins;
        } else if (this.isHealing) {
            const parts = [];
            if (this.health)
                parts.push('+' + this.health + ' ' + STAT_TEXT_LABELS.health);
            if (this.maxHealth)
                parts.push('+' + this.maxHealth + ' ' + STAT_TEXT_LABELS.maxHealth);
            descriptionString += STAT_EMOJI.HEALTH + ' ' + (parts.length ? parts.join(', ') : ITEM_TEXT.NO_BONUS);
        } else {
            const parts = [];
            if (this.minAttackPower)
                parts.push('+' + this.minAttackPower + ' ' + STAT_TEXT_LABELS.minDamage);
            if (this.maxAttackPower)
                parts.push('+' + this.maxAttackPower + ' ' + STAT_TEXT_LABELS.maxDamage);
            descriptionString += STAT_EMOJI.ATTACK + ' ' + (parts.length ? parts.join(', ') : ITEM_TEXT.NO_BONUS);
        }
        descriptionString += '\n';
        return descriptionString;
    }
}
