import { Item } from '../Item.mjs';
import { allAgressiveNPCAttackPlayer } from '../Game.mjs';

/**
 * Обработка покупки у торговца (buy)
 * - Если торговца нет на локации - сообщение об ошибке
 * - Если недостаточно монет - сообщение и пометка торговца как использованного
 * - Если хватает монет - покупка предмета, списание монет, добавление предмета на локацию
 * - Показывает статистику игрока и текущую локацию с картой
 */
export function handleBuy(params) {
    const { session, player, world, query, bot, updatePlayerStats, updateGlobalStats } = params;

    let message = '';
    const x = player.getX();
    const y = player.getY();

    let merchantFound = null;
    world.npcs.forEach((npc) => {
        if (npc.isMerchant() && npc.x === x && npc.y === y) {
            merchantFound = npc;
        }
    });

    if (!merchantFound) {
        message += 'Здесь нет торговца.\n';
    } else {
        const price = merchantFound.merchantPrice;
        
        if (player.coins < price) {
            message += `${merchantFound.name} просит ${price} монет за товар, но у вас недостаточно денег.\n`;
            merchantFound.merchantUsed = true;
        } else {
            player.coins -= price;
            updatePlayerStats(session, { coinsSpent: price, itemPurchased: true });
            updateGlobalStats({ itemPurchased: true });
            
            const newItem = new Item();
            newItem.setupAtLocation(x, y);
            world.items.push(newItem);
            
            message += `${merchantFound.name} продал вам ${newItem.name} за ${price} монет.\n`;
            merchantFound.merchantUsed = true;
        }
    }

    message += player.getPlayerDescription() + '\n';
    message +=
        '\n' +
        world.GetLocationText(x, y, player) +
        player.getLocationCoords() +
        world.printWorldMap(x, y, player);

    const { generateInlineButtons } = params;
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

/**
 * Обработка помощи квестодателю (help)
 * - Если квестодателя нет - сообщение об ошибке
 * - Если квест выполнен успешно - выдаёт награду (монеты или предмет), начисляет 10 XP
 * - Если квест не выполнен - квестодатель нападает на игрока (возможна смерть)
 * - Показывает статистику игрока и локацию или сообщение о смерти
 */
export function handleHelp(params) {
    const { session, player, world, query, bot, STAT_EMOJI, updatePlayerStats, updateGlobalStats, generateInlineButtons, generateDeathButtons } = params;

    let message = '';
    const x = player.getX();
    const y = player.getY();
    let playerDied = false;

    let questGiverFound = null;
    world.npcs.forEach((npc) => {
        if (npc.isQuestGiver() && npc.x === x && npc.y === y) {
            questGiverFound = npc;
        }
    });

    if (!questGiverFound) {
        message += 'Здесь нет того, кому можно помочь.\n';
    } else {
        if (questGiverFound.didHelpSucceed()) {
            const reward = questGiverFound.getQuestReward();
            let rewardCount = 0;
            
            if (reward.coinsReward > 0) {
                const coinItem = new Item();
                coinItem.setupAtLocation(x, y);
                coinItem.isCoin = true;
                coinItem.coins = reward.coinsReward;
                coinItem.name = reward.coinsReward === 1 ? 'Монета' : (reward.coinsReward >= 5 && reward.coinsReward <= 20 ? 'Монеты' : 'Монет');
                world.items.push(coinItem);
                rewardCount++;
            }
            
            if (reward.itemReward) {
                const newItem = new Item();
                newItem.setupAtLocation(x, y);
                newItem.isCoin = false;
                newItem.isWeapon = false;
                newItem.isHealing = false;
                newItem.health = 0;
                newItem.maxHealth = 0;
                newItem.minAttackPower = 0;
                newItem.maxAttackPower = 0;
                
                if (reward.itemReward.isWeapon) {
                    newItem.isWeapon = true;
                    newItem.minAttackPower = reward.itemReward.minAttackPower;
                    newItem.maxAttackPower = reward.itemReward.maxAttackPower;
                    newItem.name = 'Оружие';
                } else {
                    newItem.isHealing = true;
                    newItem.health = reward.itemReward.health;
                    newItem.maxHealth = reward.itemReward.maxHealth;
                    newItem.name = 'Зелье';
                }
                
                world.items.push(newItem);
                rewardCount++;
            }
            
            if (rewardCount > 0) {
                message += `Вы помогли ${questGiverFound.name}! ${STAT_EMOJI.COINS} Вам выпала награда!\n`;
            } else {
                message += `Вы помогли ${questGiverFound.name}, но не получили награды.\n`;
            }
            
            questGiverFound.questCompleted = true;
            updatePlayerStats(session, { questCompleted: true });
            updateGlobalStats({ questCompleted: true });
        } else {
            message += `Вы попытались помочь ${questGiverFound.name}, но ему что-то не понравилось!\n`;
            message += `${questGiverFound.name} разозлился и напал на вас!\n`;
            questGiverFound.becomeAggressive();
            questGiverFound.questCompleted = true;
            
            const npcAttackResult = allAgressiveNPCAttackPlayer(world, player, x, y);
            message += npcAttackResult.text;
            
            if (npcAttackResult.stats.playerDied) {
                playerDied = true;
                updateGlobalStats({ gameCompleted: true, death: true });
                updatePlayerStats(session, { gameCompleted: true, death: true });
                message += '\n' + STAT_EMOJI.DEAD + ' ВЫ ПОГИБЛИ! Игра окончена.\nНажмите /start чтобы начать заново.';
            }
        }
    }

    if (!playerDied) {
        message += '\n' + player.getPlayerDescription() + '\n\n';
        message +=
            world.GetLocationText(x, y, player) +
            player.getLocationCoords() +
            world.printWorldMap(x, y, player);
    }

    const buttons = playerDied
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
