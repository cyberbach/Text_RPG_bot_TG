import { getHitChanceModifier, getCurrentEvent } from './EventSystem.mjs';
import { STAT_EMOJI } from './TextEnums/SmileInText.mjs';
import { getRandomMissReason, LIGHTNING_MESSAGES } from './TextEnums/MissReasons.mjs';
import { SPAWN_CHANCES } from './GameSetup.mjs';
import { NPC_TYPE } from './NPC.mjs';
import { Item } from './Item.mjs';

// Атака игроком всех NPC на текущей локации
export function playerAttackNPC(inWorld, inPlayer) {
    let attackResult = '';
    let stats = { damageDealt: 0, monstersKilled: 0, coinsGained: 0, xpGained: 0, leveledUp: false, levelUpStats: null };
    const x = inPlayer.getX();
    const y = inPlayer.getY();

    const npcs = inWorld.getNPCsAtLocation(x, y);
    const hitChance = inPlayer.getHitChance(getHitChanceModifier());
    
    const npcsToRemove = [];

    npcs.forEach((oneNpc) => {
        if (Math.random() * 100 < hitChance) {
            const damageAmount = inPlayer.getAttackPower();
            const isAlive = oneNpc.modifyHealth(-damageAmount);
            stats.damageDealt += damageAmount;
            attackResult +=
                inPlayer.name +
                ' наносит ' +
                damageAmount +
                ' урона ' +
                oneNpc.name +
                '\n';
            if (!isAlive) {
                stats.monstersKilled++;
                attackResult += oneNpc.name + ' ' + STAT_EMOJI.KILL + '\n';
                
                const { gained: xpGained } = inPlayer.addExperience(oneNpc.maxAttackPower);
                stats.xpGained += xpGained;
                
                const coinAmount = 1 + Math.floor(Math.random() * 5);
                inPlayer.coins += coinAmount;
                stats.coinsGained += coinAmount;
                
                const coinWord = coinAmount === 1 ? 'Монету' : 'Монет';
                const xpText = xpGained > 0 ? ` и получили ✨ +${xpGained} Опыта` : '';
                attackResult += `Вы получили ${STAT_EMOJI.COINS} ${coinAmount} ${coinWord}${xpText}\n`;
                
                if (oneNpc.npcType === NPC_TYPE.BOSS) {
                    const bossDrop = generateBossDrop(inPlayer, inWorld, x, y);
                    attackResult += bossDrop.message;
                }
                
                inWorld.generateOneItem(x, y);
                npcsToRemove.push(oneNpc);
            }
        } else {
            let missText = inPlayer.name + ' промахнулся';
            if (Math.random() < SPAWN_CHANCES.MISS_REASON) {
                missText += ' (' + getRandomMissReason(getCurrentEvent()) + ')';
            }
            attackResult += missText + '\n';
        }
    });
    
    npcsToRemove.forEach(npc => {
        const indexToRemove = inWorld.npcs.findIndex(n => n === npc);
        if (indexToRemove !== -1) {
            inWorld.npcs.splice(indexToRemove, 1);
        }
    });

    return { text: attackResult, stats };
}

// Атака всех агрессивных NPC по игроку
export function allAgressiveNPCAttackPlayer(inWorld, inPlayer, attackX, attackY) {
    let attackResult = '';
    let stats = { damageTaken: 0, playerDied: false };
    const x = attackX !== undefined ? attackX : inPlayer.getX();
    const y = attackY !== undefined ? attackY : inPlayer.getY();

    let isAlive = true;

    const npcs = inWorld.getNPCsAtLocation(x, y);
    npcs.forEach((oneNpc) => {
        if (isAlive && oneNpc.isAggressiveMonster()) {
            if (Math.random() > 0.5) {
                const damageAmount =
                    Math.min(oneNpc.minAttackPower, oneNpc.maxAttackPower) +
                    Math.floor(
                        Math.random() *
                            (Math.abs(oneNpc.maxAttackPower - oneNpc.minAttackPower) + 1)
                    );

                isAlive = inPlayer.modifyHealth(-damageAmount);
                stats.damageTaken += damageAmount;
                attackResult +=
                    oneNpc.name +
                    ' наносит ' +
                    damageAmount +
                    ' урона ' +
                    inPlayer.name +
                    '\n';

                if (!isAlive) {
                    stats.playerDied = true;
                    attackResult +=
                        inPlayer.name + ' ' + STAT_EMOJI.KILL + '\n\nКОНЕЦ ИГРЫ!\n';
                }
            } else {
                let missText = oneNpc.name + ' промахнулся';
                if (Math.random() < SPAWN_CHANCES.MISS_REASON) {
                    missText += ' (' + getRandomMissReason(getCurrentEvent()) + ')';
                }
                attackResult += missText + '\n';
            }
        }
    });

    return { text: attackResult, stats };
}

// Удар молнией во время боя (только во время дождя)
export function lightningStrike(inWorld, inPlayer) {
    const currentWeather = getCurrentEvent();
    if (currentWeather !== 'weather_rainy') {
        return null;
    }
    
    if (Math.random() >= SPAWN_CHANCES.LIGHTNING) {
        return null;
    }
    
    const targets = [...inWorld.getNPCsAtLocation(inPlayer.getX(), inPlayer.getY()), inPlayer];
    const target = targets[Math.floor(Math.random() * targets.length)];
    
    const isPlayer = target === inPlayer;
    const damage = target.maxAttackPower;
    
    const lightningMessage = LIGHTNING_MESSAGES[Math.floor(Math.random() * LIGHTNING_MESSAGES.length)];
    
    let result = STAT_EMOJI.WEATHER_STORMY + ' ' + lightningMessage + '\n';
    
    if (isPlayer) {
        inPlayer.modifyHealth(-damage);
        result += `${target.name} получает ${damage} урона от молнии!\n`;
    } else {
        target.modifyHealth(-damage);
        result += `${target.name} получает ${damage} урона от молнии!\n`;
        if (target.health <= 0) {
            const indexToRemove = inWorld.npcs.findIndex(npc => npc === target);
            if (indexToRemove !== -1) {
                inWorld.npcs.splice(indexToRemove, 1);
            }
            result += target.name + ' ' + STAT_EMOJI.KILL + '\n';
        }
    }
    
    return { 
        text: result,
        damage,
        target,
        isPlayer
    };
}

// Генерация дропа с босса
function generateBossDrop(player, world, x, y) {
    const dropType = Math.floor(Math.random() * 3);
    
    const newItem = new Item();
    
    if (dropType === 0) {
        const coins = 50 + Math.floor(Math.random() * 50);
        const coinWord = coins === 1 ? 'Монету' : (coins >= 5 && coins <= 20 ? 'Монеты' : 'Монет');
        player.coins += coins;
        return { message: `💰 Сокровищница босса! Вы получили ${coins} ${coinWord}!\n` };
    }
    
    if (dropType === 1) {
        newItem.isCoin = false;
        newItem.isWeapon = true;
        newItem.isHealing = false;
        newItem.x = x;
        newItem.y = y;
        newItem.minAttackPower = Math.floor(player.maxAttackPower * 0.5) + 5;
        newItem.maxAttackPower = Math.floor(player.maxAttackPower * 0.8) + 10;
        newItem.name = '🗡️ Легендарное Оружие Босса';
        world.items.push(newItem);
        return { message: `⚔️ Босс оставил мощное оружие! Подберите его!\n` };
    }
    
    newItem.isCoin = false;
    newItem.isHealing = true;
    newItem.isWeapon = false;
    newItem.x = x;
    newItem.y = y;
    newItem.health = Math.floor(player.maxHealth * 0.5) + 20;
    newItem.maxHealth = Math.floor(player.maxHealth * 0.3) + 10;
    newItem.name = '🧪 Легендарное Зелье Босса';
    world.items.push(newItem);
    return { message: `❤️ Босс оставил легендарное зелье! Подберите его!\n` };
}
