import { allAgressiveNPCAttackPlayer } from '../Game.mjs';
import { DIRECTIONS } from '../MovementDirections.mjs';
import { tickEventDuration, getCurrentEventName, getHitChanceModifier } from '../EventSystem.mjs';

const DIRECTION_NAMES = {
    'move_up': 'Север',
    'move_down': 'Юг',
    'move_left': 'Запад',
    'move_right': 'Восток'
};

/**
 * Обработка движения игрока (move_up, move_down, move_left, move_right)
 * - Проверяет возможность движения
 * - Если нельзя двигаться - начисляет 1 XP и показывает текущую локацию
 * - Если двигается - атака от агрессивных NPC на старой локации (если игрок погибает - конец игры)
 * - Отмечает портал как посещённый, если игрок на него встал
 * - Обновляет NPC для новой локации при первом посещении
 * - Показывает новую локацию с картой и погодой
 */
export function handleMovement(params) {
    const { session, player, world, action, query, bot, STAT_EMOJI, updateGlobalStats, updatePlayerStats, generateInlineButtons, generateDeathButtons } = params;

    let message = '';
    const oldX = player.getX();
    const oldY = player.getY();
    
    let moved = false;
    switch (action) {
        case 'move_up':
            moved = player.move(DIRECTIONS.UP);
            break;
        case 'move_down':
            moved = player.move(DIRECTIONS.DOWN);
            break;
        case 'move_left':
            moved = player.move(DIRECTIONS.LEFT);
            break;
        case 'move_right':
            moved = player.move(DIRECTIONS.RIGHT);
            break;
    }

    const x = player.getX();
    const y = player.getY();
    const directionName = DIRECTION_NAMES[action] || 'неизвестное направление';

    if (!moved) {
        message += 'Нельзя идти туда.\n\n';
        const expResult = player.addExperienceForAction(1);
        if (expResult.leveledUp && expResult.statsGained) {
            message += `${STAT_EMOJI.LEVEL_UP} *ПОВЫШЕНИЕ УРОВНЯ!*\n`;
            message += `${STAT_EMOJI.HEALTH} Здоровье увеличено на ${expResult.statsGained.hpBonus}\n`;
            message += `${STAT_EMOJI.ATTACK} Атака увеличена на ${expResult.statsGained.minAttackBonus}\n\n`;
        }

        message +=
            world.GetLocationText(x, y, player) +
            player.getLocationCoords() +
            world.printWorldMap(x, y);

        const buttons = generateInlineButtons(
            world.getAvailableDirections(x, y),
            world.getAvailableActions(x, y)
        );

        if (query.message) {
            bot.editMessageText(message, {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
                reply_markup: JSON.stringify({ inline_keyboard: [] }),
                parse_mode: 'Markdown'
            });
        }

        return { message, buttons, removeKeyboard: true, editOnly: true };
    }

    const npcsOnOldLocation = world.getNPCsAtLocation(oldX, oldY);
    const agressiveNPCsOnOldLocation = npcsOnOldLocation.filter(npc => npc.isAggressive());
    
    let isPlayerDied = false;
    
    if (agressiveNPCsOnOldLocation.length > 0) {
        const npcAttackResult = allAgressiveNPCAttackPlayer(world, player, oldX, oldY);
        message += npcAttackResult.text;
        updateGlobalStats({ damageTaken: npcAttackResult.stats.damageTaken });
        updatePlayerStats(session, { damageTaken: npcAttackResult.stats.damageTaken });
        
        if (npcAttackResult.stats.playerDied) {
            isPlayerDied = true;
            updateGlobalStats({ gameCompleted: true, death: true });
            updatePlayerStats(session, { gameCompleted: true, death: true });
            message += '\n' + STAT_EMOJI.DEAD + ' ВЫ ПОГИБЛИ! Игра окончена.\nНажмите /start чтобы начать заново.';
        }
    }

    if (!isPlayerDied) {
        const portalAtNewLocation = world.getPortalAtLocation(x, y);
        if (portalAtNewLocation) {
            portalAtNewLocation.visited = true;
        }

        if (!player.isCellVisited(x, y)) {
            world.recalculateNPCsForLevel(player.heroLevel);
            player.markCellVisited(x, y);
        }

        const weatherChanged = tickEventDuration();

        const locationMessage =
            world.GetLocationText(x, y, player) +
            player.getLocationCoords() +
            world.printWorldMap(x, y);
        
        let moveMessage = `Вы перешли на ${directionName}`;
        if (weatherChanged) {
            const hitChance = player.getHitChance(getHitChanceModifier());
            moveMessage += `. ${getCurrentEventName()} ${STAT_EMOJI.ACCURACY}${hitChance}% точности при атаке.`;
        }
        moveMessage += '\n\n';
        
        message += moveMessage + locationMessage;
    }

    const buttons = isPlayerDied 
        ? generateDeathButtons()
        : generateInlineButtons(
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
