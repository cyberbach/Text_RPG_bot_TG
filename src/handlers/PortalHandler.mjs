import { allAgressiveNPCAttackPlayer } from '../Game.mjs';
import { PLAYER_SETTINGS } from '../GameSetup.mjs';

/**
 * Обработка использования портала (portal)
 * - Если портала нет - сообщение об ошибке
 * - Если портал в другой мир (worldPortal):
 *   - Генерирует новый мир с новой картой
 *   - Сбрасывает атрибуты игрока
 *   - Отмечает портал как посещённый
 * - Если портал телепорт (обычный):
 *   - Телепортирует в случайную точку мира
 *   - Атака от агрессивных NPC на новой локации (возможна смерть)
 *   - Начисляет 50% XP от следующего уровня
 * - Показывает новую локацию или сообщение о смерти
 */
export function handlePortal(params) {
    const { session, player, world, query, bot, STAT_EMOJI, updatePlayerStats, updateGlobalStats, generateInlineButtons } = params;

    let message = '';
    const x = player.getX();
    const y = player.getY();

    const portal = world.getPortalAtLocation(x, y);

    if (!portal) {
        message += 'Здесь нет портала.\n';
        return { message, buttons: null, removeKeyboard: false };
    }

    portal.visited = true;
    updatePlayerStats(session, { portalUsed: true });
    updateGlobalStats({ portalUsed: true });
    
    if (portal.isWorldPortal) {
        message += `${STAT_EMOJI.PORTAL} Вы вошли в портал...\n\n`;

        const width = session.mode === 'pc' ? params.WORLD_PC_WIDTH : params.WORLD_MOBILE_WIDTH;
        const height = session.mode === 'pc' ? params.WORLD_PC_HEIGHT : params.WORLD_MOBILE_HEIGHT;

        world.setup(width, height);
        world.generate();
        player.maxWidth = width;
        player.maxHeight = height;
        player.visitedCells = new Set();
        player.visibleCells = new Set();
        player.setRandomLocation();

        const nx = player.getX();
        const ny = player.getY();
        world.generateNPC(nx, ny);
        world.generateMerchant(nx, ny);
        world.generateQuestGiver(nx, ny);
        world.generateStoryteller(nx, ny);
        world.generateItems(nx, ny);
        world.generatePortals(nx, ny);
        world.generateBoss(nx, ny);
        world.setPortalHintsForQuestGivers();
        player.markCellVisited(nx, ny);
        player.markAreaVisible(nx, ny, PLAYER_SETTINGS.VISIBILITY_WIDTH, PLAYER_SETTINGS.VISIBILITY_HEIGHT);

        world.recalculateNPCsForLevel(player.heroLevel);

        message += `Вы прибыли в новый мир: *${world.worldName}*\n\n`;

        const locationMessage =
            world.GetLocationText(nx, ny, player) +
            player.getLocationCoords() +
            world.printWorldMap(nx, ny, player);
        message += locationMessage;

        updateGlobalStats({ worldChange: true });

        const buttons = generateInlineButtons(
            world.getAvailableDirections(nx, ny),
            world.getAvailableActions(nx, ny)
        );

        if (query.message) {
            bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
            });
        }

        return { message, buttons, removeKeyboard: true };
    }

    let newX, newY;
    do {
        newX = Math.floor(Math.random() * world.width);
        newY = Math.floor(Math.random() * world.height);
    } while (newX === x && newY === y);

    player.setPosition(newX, newY);
    player.markAreaVisible(newX, newY, PLAYER_SETTINGS.VISIBILITY_WIDTH, PLAYER_SETTINGS.VISIBILITY_HEIGHT);
    const portalAtNewLocation = world.getPortalAtLocation(newX, newY);
    if (portalAtNewLocation) {
        portalAtNewLocation.visited = true;
    }
    message += `${STAT_EMOJI.PORTAL} Вы зашли в портал и телепортировались в случайную точку мира!\n\n`;
    
    const npcsAtNewLocation = world.getNPCsAtLocation(newX, newY);
    const agressiveNPCsAtNewLocation = npcsAtNewLocation.filter(npc => npc.isAggressiveMonster());
    
    if (agressiveNPCsAtNewLocation.length > 0) {
        const npcAttackResult = allAgressiveNPCAttackPlayer(world, player);
        message += npcAttackResult.text + '\n';
        updateGlobalStats({ damageTaken: npcAttackResult.stats.damageTaken });
        updatePlayerStats(session, { damageTaken: npcAttackResult.stats.damageTaken });
        
        if (npcAttackResult.stats.playerDied) {
            updateGlobalStats({ gameCompleted: true, death: true });
            updatePlayerStats(session, { gameCompleted: true, death: true });
            message += '\n' + STAT_EMOJI.DEAD + ' ВЫ ПОГИБЛИ! Игра окончена.\nНажмите /start чтобы начать заново.';
            
            const { generateDeathButtons } = params;
            const buttons = generateDeathButtons();

            if (query.message) {
                bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
                    chat_id: query.message.chat.id,
                    message_id: query.message.message_id,
                });
            }

            return { message, buttons, removeKeyboard: true };
        }
    }
    
    const xpForNextLevel = player.getXPToNextLevel();
    const xpReward = Math.floor(xpForNextLevel / 2);
    const expResult = player.addExperienceForAction(xpReward);
    message += `✨ Получено опыта: +${xpReward}\n`;
    if (expResult.leveledUp && expResult.statsGained) {
        message += `\n${STAT_EMOJI.LEVEL_UP} *ПОВЫШЕНИЕ УРОВНЯ!*\n`;
        message += `${STAT_EMOJI.HEALTH} Здоровье увеличено на ${expResult.statsGained.hpBonus}\n`;
        message += `${STAT_EMOJI.ATTACK} Атака увеличена на ${expResult.statsGained.minAttackBonus}\n`;
    }
    message += '\n';

    message += player.getPlayerDescription() + '\n\n';

    const locationMessage =
        world.GetLocationText(newX, newY, player) +
        player.getLocationCoords() +
        world.printWorldMap(newX, newY, player);
    message += locationMessage;

    const buttons = generateInlineButtons(
        world.getAvailableDirections(newX, newY),
        world.getAvailableActions(newX, newY)
    );

    if (query.message) {
        bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
        });
    }

    return { message, buttons, removeKeyboard: true };
}
