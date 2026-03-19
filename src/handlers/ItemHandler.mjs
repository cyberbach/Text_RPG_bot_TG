import { allAgressiveNPCAttackPlayer } from '../Game.mjs';

/**
 * Обработка подбора предмета (use)
 * - Если предметов нет - показывает сообщение и текущую локацию
 * - Подбирает случайный предмет с локации
 * - Применяет бонусы предмета к игроку (HP, атака)
 * - Начисляет 1 XP за подбор
 * - Атака от агрессивных NPC после подбора (если игрок погибает - конец игры)
 * - Показывает обновлённую статистику игрока и локацию
 */
export function handleItemUse(params) {
    const { session, player, world, query, bot, STAT_EMOJI, updateGlobalStats, updatePlayerStats, generateInlineButtons, generateDeathButtons } = params;

    let message = '';
    const x = player.getX();
    const y = player.getY();

    const itemsToUse = world.getItemsAtLocation(x, y);
    if (itemsToUse.length === 0) {
        message =
            'На локации нет предметов.\n\n' +
            world.GetLocationText(x, y, player) +
            player.getLocationCoords() +
            world.printWorldMap(x, y, player);

        const buttons = generateInlineButtons(
            world.getAvailableDirections(x, y),
            world.getAvailableActions(x, y)
        );

        return { message, buttons, removeKeyboard: true };
    }

    const oneItemToUse = itemsToUse[Math.floor(Math.random() * itemsToUse.length)];
    const useResult = player.useItem(oneItemToUse);
    message = useResult.text;
    
    message += '\n' + player.getPlayerDescription();
    
    const indexToRemove = world.items.findIndex(item => item === oneItemToUse);
    world.items.splice(indexToRemove, 1);
    updateGlobalStats({ itemFound: true, heroLevel: player.heroLevel });
    updatePlayerStats(session, { itemFound: true, heroLevel: player.heroLevel, coinsGained: useResult.coinsGained });

    const npcsAtLocation = world.getNPCsAtLocation(x, y);
    const agressiveNPCs = npcsAtLocation.filter(npc => npc.isAggressiveMonster());
    let isPlayerDied = false;
    
    if (agressiveNPCs.length > 0) {
        const npcAttackResult = allAgressiveNPCAttackPlayer(world, player);
        message += '\n' + npcAttackResult.text;
        updateGlobalStats({ damageTaken: npcAttackResult.stats.damageTaken });
        updatePlayerStats(session, { damageTaken: npcAttackResult.stats.damageTaken });
        
        if (npcAttackResult.stats.playerDied) {
            isPlayerDied = true;
            updateGlobalStats({ gameCompleted: true, death: true });
            updatePlayerStats(session, { gameCompleted: true, death: true });
            message += '\n' + STAT_EMOJI.DEAD + ' ВЫ ПОГИБЛИ! Игра окончена.\nНажмите /start чтобы начать заново.';
        }
    }

    message += '\n' +
        world.GetLocationText(x, y, player) +
        player.getLocationCoords() +
        world.printWorldMap(x, y, player);

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

/**
 * Обработка подбора всех предметов (take_all)
 * - Подбирает все предметы с локации
 * - Применяет бонусы всех предметов к игроку
 * - Показывает обновлённую статистику игрока и локацию
 */
export function handleTakeAllItems(params) {
    const { session, player, world, query, bot, updateGlobalStats, updatePlayerStats, generateInlineButtons } = params;

    let message = '';
    const x = player.getX();
    const y = player.getY();

    const itemsToUse = world.getItemsAtLocation(x, y);
    if (itemsToUse.length === 0) {
        message =
            'На локации нет предметов.\n\n' +
            world.GetLocationText(x, y, player) +
            player.getLocationCoords() +
            world.printWorldMap(x, y, player);

        const buttons = generateInlineButtons(
            world.getAvailableDirections(x, y),
            world.getAvailableActions(x, y)
        );

        return { message, buttons, removeKeyboard: true };
    }

    let totalCoinsGained = 0;
    let totalXpGained = 0;
    let itemsTaken = 0;
    
    for (const oneItemToUse of itemsToUse) {
        const useResult = player.useItem(oneItemToUse);
        totalCoinsGained += useResult.coinsGained || 0;
        totalXpGained += useResult.xpGained || 0;
        itemsTaken++;
        
        const indexToRemove = world.items.findIndex(item => item === oneItemToUse);
        if (indexToRemove !== -1) {
            world.items.splice(indexToRemove, 1);
        }
    }
    
    const lastDigit = itemsTaken % 10;
    const lastTwoDigits = itemsTaken % 100;
    let itemWord;
    if (lastDigit === 1 && lastTwoDigits !== 11) {
        itemWord = 'предмет';
    } else if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
        itemWord = 'предмета';
    } else {
        itemWord = 'предметов';
    }
    
    const xpText = totalXpGained > 0 ? ` и получили ✨ +${totalXpGained} Опыта` : '';
    message += `Вы подобрали 📦 ${itemsTaken} ${itemWord}${xpText}\n`;
    message += '\n' + player.getPlayerDescription();

    updateGlobalStats({ itemFound: true, heroLevel: player.heroLevel });
    updatePlayerStats(session, { itemFound: true, heroLevel: player.heroLevel, coinsGained: totalCoinsGained });

    message += '\n' +
        world.GetLocationText(x, y, player) +
        player.getLocationCoords() +
        world.printWorldMap(x, y, player);

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
