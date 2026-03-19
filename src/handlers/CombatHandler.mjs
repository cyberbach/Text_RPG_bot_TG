import { allAgressiveNPCAttackPlayer, playerAttackNPC, lightningStrike } from '../Game.mjs';

/**
 * Обработка атаки игрока (attack)
 * - Сначала атакуют агрессивные NPC (если игрок погибает - конец игры)
 * - Затем атакует игрок (убивает всех NPC на локации)
 * - Если все NPC убиты - начисляется XP (5 * количество убитых)
 * - Показывает оставшихся NPC или новую локацию с картой
 */
export function handleCombat(params) {
    const { session, player, world, query, bot, STAT_EMOJI, updateGlobalStats, updatePlayerStats, generateInlineButtons, generateDeathButtons } = params;

    let message = '';
    const x = player.getX();
    const y = player.getY();

    let playerAttackResult, npcAttackResult;
    
    npcAttackResult = allAgressiveNPCAttackPlayer(world, player);
    
    if (npcAttackResult.stats.playerDied) {
        message += npcAttackResult.text;
        
        updateGlobalStats({ damageTaken: npcAttackResult.stats.damageTaken });
        updateGlobalStats({ gameCompleted: true, death: true });
        updatePlayerStats(session, { damageTaken: npcAttackResult.stats.damageTaken });
        updatePlayerStats(session, { gameCompleted: true, death: true });
        session.combatState = false;
        message += '\n' + STAT_EMOJI.DEAD + ' ВЫ ПОГИБЛИ! Игра окончена.\nНажмите /start чтобы начать заново.';
        
        const buttons = generateDeathButtons();
        
        if (query.message) {
            bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
            });
        }
        
        return { message, buttons, removeKeyboard: true, editOnly: true };
    }
    
    playerAttackResult = playerAttackNPC(world, player);
    message += npcAttackResult.text + playerAttackResult.text;

    updateGlobalStats({
        damageDealt: playerAttackResult.stats.damageDealt,
        damageTaken: npcAttackResult.stats.damageTaken,
        coinsGained: playerAttackResult.stats.coinsGained,
    });
    updatePlayerStats(session, {
        damageDealt: playerAttackResult.stats.damageDealt,
        damageTaken: npcAttackResult.stats.damageTaken,
        coinsGained: playerAttackResult.stats.coinsGained,
    });

    // Проверка удара молнией
    const lightningResult = lightningStrike(world, player);
    if (lightningResult) {
        message += '\n' + lightningResult.text;
        if (lightningResult.isPlayer) {
            updateGlobalStats({ damageTaken: lightningResult.damage });
            updatePlayerStats(session, { damageTaken: lightningResult.damage });
            if (player.health <= 0) {
                message += '\n' + STAT_EMOJI.DEAD + ' ВЫ ПОГИБЛИ! Игра окончена.\nНажмите /start чтобы начать заново.';
                updateGlobalStats({ gameCompleted: true, death: true });
                updatePlayerStats(session, { gameCompleted: true, death: true });
                session.combatState = false;
                return { message, buttons: generateDeathButtons(), removeKeyboard: true };
            }
        }
    }

    message += '\n';
    let liveNPCs = world.getNPCsAtLocation(x, y);

    if (liveNPCs.length == 0) {
        session.combatState = false;
        
        if (playerAttackResult.stats.monstersKilled > 0) {
            const xpGained = playerAttackResult.stats.monstersKilled * 5;
            const expResult = player.addExperienceForAction(xpGained);
            message += `✨ Опыт за убитых врагов: +${expResult.gained}\n`;
            if (expResult.leveledUp && expResult.statsGained) {
                message += `\n${STAT_EMOJI.LEVEL_UP} *ПОВЫШЕНИЕ УРОВНЯ!*\n`;
                message += `${STAT_EMOJI.HEALTH} Здоровье увеличено на ${expResult.statsGained.hpBonus}\n`;
                message += `${STAT_EMOJI.ATTACK} Атака увеличена на ${expResult.statsGained.minAttackBonus}\n`;
            }
            updateGlobalStats({ monsterKilled: true, heroLevel: player.heroLevel });
            updatePlayerStats(session, { monsterKilled: true, heroLevel: player.heroLevel });
        }
        
        message += '\n' +
            world.GetLocationText(x, y, player) +
            world.printWorldMap(x, y);
    } else {
        message += world.getNPCsText(x, y);
        message += player.getPlayerDescription() + '\n';
    }

    const buttons = generateInlineButtons(
        world.getAvailableDirections(x, y),
        world.getAvailableActions(x, y)
    );

    if (query.message) {
        bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
        });
    }

    return { message, buttons, removeKeyboard: true };
}
