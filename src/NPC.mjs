import { AdjectiveWords } from './TextEnums/AdjectiveWords.mjs';
import { DEBUG_NPC_CREATION, NPC_SETTINGS, QUEST_SETTINGS } from './GameSetup.mjs';
import { STAT_EMOJI } from './TextEnums/SmileInText.mjs';
import { MonsterNames } from './TextEnums/MonsterNames.mjs';
import { NPC_TEXT } from './TextEnums/NPCTextLabels.mjs';

export const NPC_TYPE = Object.freeze({
    MONSTER: 'monster',
    MERCHANT: 'merchant',
    QUEST_GIVER: 'quest_giver',
});

export class NPC {
    constructor() {
        const { BASE_HEALTH, BASE_ARMOR, BASE_ATTACK, ATTACK_RANGE } = NPC_SETTINGS;
        this.maxHealth = BASE_HEALTH.MIN + 
            Math.floor(Math.random() * (BASE_HEALTH.MAX - BASE_HEALTH.MIN + 1)) +
            Math.floor(Math.random() * (BASE_HEALTH.MAX - BASE_HEALTH.MIN + 1));
        this.maxArmor = BASE_ARMOR;
        this.health = this.maxHealth;
        this.armor = 0;
        this.minAttackPower = BASE_ATTACK.MIN;
        this.maxAttackPower = BASE_ATTACK.MAX;
        this.agressive = false;
        this.name = '';
        this.npcType = NPC_TYPE.MONSTER;
        this.questCompleted = false;
        this.merchantUsed = false;
        this.merchantPrice = 0;
    }

    setup(worldWidth, worldHeight, excludeX, excludeY) {
        this.x = Math.floor(Math.random() * worldWidth);
        this.y = Math.floor(Math.random() * worldHeight);

        if (this.x === excludeX && this.y === excludeY) {
            this.x = Math.floor(Math.random() * worldWidth);
            this.y = Math.floor(Math.random() * worldHeight);
        }

        const { BASE_ATTACK, ATTACK_RANGE } = NPC_SETTINGS;
        this.minAttackPower = BASE_ATTACK.MIN + Math.floor(Math.random() * (BASE_ATTACK.MAX - BASE_ATTACK.MIN + 1));
        this.maxAttackPower = this.minAttackPower + Math.floor(Math.random() * (ATTACK_RANGE + 1));

        const adjectives = Object.values(AdjectiveWords);
        const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];

        const baseNames = Object.values(MonsterNames);
        const randomBaseName = baseNames[Math.floor(Math.random() * baseNames.length)];

        this.name = `${randomAdj} ${randomBaseName}`;
        this.agressive = Math.random() >= 0.5;

        if (DEBUG_NPC_CREATION) {
            console.log('Created NPC:', this.name, ' at ', this.x, '/', this.y);
        }
    }

    getNpcDescription() {
        const attackString = STAT_EMOJI.ATTACK + ' ' + this.minAttackPower + '..' + this.maxAttackPower;
        let descriptionString = STAT_EMOJI.MONSTER + ' ' + this.name + ' ';

        if (this.agressive) {
            descriptionString += STAT_EMOJI.HEALTH + ' ' + this.health + attackString;
        } else if (this.npcType === NPC_TYPE.MERCHANT && !this.merchantUsed) {
            descriptionString += STAT_EMOJI.FULL_HEALTH + ' (' + NPC_TEXT.MERCHANT_ASKING + STAT_EMOJI.COINS + ' ' + this.merchantPrice + NPC_TEXT.MONET_SUFFIX;
        } else if (this.npcType === NPC_TYPE.QUEST_GIVER && !this.questCompleted) {
            descriptionString += STAT_EMOJI.FULL_HEALTH + ' (' + NPC_TEXT.QUEST_NEED_HELP;
        } else if (this.npcType === NPC_TYPE.QUEST_GIVER && this.questCompleted) {
            descriptionString += STAT_EMOJI.FULL_HEALTH + ' (' + NPC_TEXT.PEACEFUL;
        } else if (this.npcType === NPC_TYPE.MERCHANT && this.merchantUsed) {
            descriptionString += STAT_EMOJI.FULL_HEALTH + ' (' + NPC_TEXT.PEACEFUL;
        } else {
            descriptionString += STAT_EMOJI.FULL_HEALTH + ' (' + NPC_TEXT.PEACEFUL;
        }
        descriptionString += '\n';

        return descriptionString;
    }

    modifyHealth(amount) {
        this.health += amount;
        this.agressive = true;
        return this.health > 0;
    }

    isAggressiveMonster() {
        return this.agressive && this.npcType === NPC_TYPE.MONSTER;
    }

    isAggressive() {
        return this.agressive && this.npcType !== NPC_TYPE.MERCHANT;
    }

    isMerchant() {
        return this.npcType === NPC_TYPE.MERCHANT && !this.merchantUsed;
    }

    isQuestGiver() {
        return this.npcType === NPC_TYPE.QUEST_GIVER && !this.questCompleted;
    }

    getQuestReward() {
        const hasCoins = Math.random() > 0.3;
        const { COINS_REWARD } = QUEST_SETTINGS;
        const coinsReward = hasCoins ? 
            COINS_REWARD.MIN + Math.floor(Math.random() * (COINS_REWARD.MAX - COINS_REWARD.MIN + 1)) : 0;
        
        const hasItem = Math.random() > 0.4;
        const hasGoodItem = Math.random() > 0.5;
        const { WEAPON_REWARD, HEALING_REWARD } = QUEST_SETTINGS;
        const itemReward = hasItem ? {
            isWeapon: hasGoodItem,
            isHealing: !hasGoodItem,
            minAttackPower: hasGoodItem ? WEAPON_REWARD.MIN_ATTACK + Math.floor(Math.random() * WEAPON_REWARD.MAX_ATTACK) : 0,
            maxAttackPower: hasGoodItem ? WEAPON_REWARD.MIN_ATTACK + Math.floor(Math.random() * WEAPON_REWARD.MAX_ATTACK * 1.5) : 0,
            health: !hasGoodItem ? HEALING_REWARD.HEALTH_MIN + Math.floor(Math.random() * (HEALING_REWARD.HEALTH_MAX - HEALING_REWARD.HEALTH_MIN)) : 0,
            maxHealth: !hasGoodItem ? HEALING_REWARD.MAX_HEALTH_MIN + Math.floor(Math.random() * (HEALING_REWARD.MAX_HEALTH_MAX - HEALING_REWARD.MAX_HEALTH_MIN)) : 0,
        } : null;

        return { coinsReward, itemReward };
    }

    didHelpSucceed() {
        return Math.random() > 0.3;
    }
}
