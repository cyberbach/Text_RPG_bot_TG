// bot.mjs
// > npm run dev
// > npm start

import TelegramBot from 'node-telegram-bot-api';
import { WorldGenerator } from './src/World.mjs';
import { Player } from './src/Player.mjs';
import { Item } from './src/Item.mjs';
import { allAgressiveNPCAttackPlayer, playerAttackNPC } from './src/Game.mjs';
import { DIRECTIONS } from './src/MovementDirections.mjs';
import { TG_MOVE_DIRECTIONS, TG_ACTIONS } from './src/TelegramAPIConstants.mjs';
import { initEvent, getCurrentEventName, tickEventDuration, getHitChanceModifier } from './src/EventSystem.mjs';
import { PORTAL_SETTINGS } from './src/GameSetup.mjs';
import { STAT_EMOJI } from './src/TextEnums/SmileInText.mjs';
import dotenv from 'dotenv';

dotenv.config();

const startedAt = new Date();
console.log('========================================');
console.log('TG Text RPG bot starting...');
console.log('Time:', startedAt.toISOString());
console.log('Node:', process.version);
console.log('Working dir:', process.cwd());

if (!process.env.BOT_TOKEN) {
    console.error('[FATAL] BOT_TOKEN is missing. Create a .env file with BOT_TOKEN=...');
    process.exit(1);
}
console.log('BOT_TOKEN:', `present (length ${process.env.BOT_TOKEN.length})`);
console.log('========================================');

// ================= GAME CODE ===================

const WORLD_MOBILE_WIDTH = 13; // 13 максимум на телефоне
const WORLD_MOBILE_HEIGHT = 10; // 10
const WORLD_PC_WIDTH = 22;
const WORLD_PC_HEIGHT = 16;

const globalStats = {
    gamesCompleted: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    monstersKilled: 0,
    itemsFound: 0,
    maxHeroLevel: 1,
    uniquePlayers: new Set(),
    worldsVisited: new Set(),
    totalGamesStarted: 0,
    totalCoins: 0,
    questsCompleted: 0,
    itemsPurchased: 0,
    portalsUsed: 0,
    deaths: 0,
};

// Обновление глобальной статистики (для всех игроков)
function updateGlobalStats(options) {
    if (options.damageDealt) globalStats.totalDamageDealt += options.damageDealt;
    if (options.damageTaken) globalStats.totalDamageTaken += options.damageTaken;
    if (options.monsterKilled) globalStats.monstersKilled++;
    if (options.itemFound) globalStats.itemsFound++;
    if (options.gameCompleted) globalStats.gamesCompleted++;
    if (options.gamesStarted) globalStats.totalGamesStarted += options.gamesStarted;
    if (options.coinsGained) globalStats.totalCoins += options.coinsGained;
    if (options.heroLevel && options.heroLevel > globalStats.maxHeroLevel) {
        globalStats.maxHeroLevel = options.heroLevel;
    }
    if (options.playerId) {
        globalStats.uniquePlayers.add(options.playerId);
    }
    if (options.worldName) {
        globalStats.worldsVisited.add(options.worldName);
    }
    if (options.questCompleted) globalStats.questsCompleted++;
    if (options.itemPurchased) globalStats.itemsPurchased++;
    if (options.portalUsed) globalStats.portalsUsed++;
    if (options.death) globalStats.deaths++;
}

// Формирование сообщения со статистикой
function getGlobalStatsMessage(playerStats) {
    return `📊 *ГЛОБАЛЬНАЯ СТАТИСТИКА*\n\n` +
        `${STAT_EMOJI.GAME} Всего игр начато: ${globalStats.totalGamesStarted}\n` +
        `${STAT_EMOJI.MONSTER} Уникальных игроков: ${globalStats.uniquePlayers.size}\n` +
        `${STAT_EMOJI.WORLD_MAP} Миров создано: ${globalStats.worldsVisited.size}\n` +
        `${STAT_EMOJI.CHECK} Игр пройдено: ${globalStats.gamesCompleted}\n` +
        `${STAT_EMOJI.DEAD} Смертей: ${globalStats.deaths}\n` +
        `${STAT_EMOJI.ATTACK} Всего урона нанесено: ${globalStats.totalDamageDealt}\n` +
        `${STAT_EMOJI.ARMOR} Всего урона получено: ${globalStats.totalDamageTaken}\n` +
        `${STAT_EMOJI.KILL} Всего монстров убито: ${globalStats.monstersKilled}\n` +
        `${STAT_EMOJI.ITEMS} Предметов найдено: ${globalStats.itemsFound}\n` +
        `${STAT_EMOJI.COINS} Предметов куплено: ${globalStats.itemsPurchased}\n` +
        `${STAT_EMOJI.PORTAL} Порталов использовано: ${globalStats.portalsUsed}\n` +
        `${STAT_EMOJI.COINS} Всего монет: ${globalStats.totalCoins}\n` +
        `${STAT_EMOJI.LEVEL} Максимальный уровень: ${globalStats.maxHeroLevel}\n\n` +
        `📈 *СТАТИСТИКА ИГРОКА*\n\n` +
        `${STAT_EMOJI.CHECK} Игр пройдено: ${playerStats.gamesCompleted}\n` +
        `${STAT_EMOJI.DEAD} Смертей: ${playerStats.deaths}\n` +
        `${STAT_EMOJI.ATTACK} Нанесено урона: ${playerStats.totalDamageDealt}\n` +
        `${STAT_EMOJI.ARMOR} Получено урона: ${playerStats.totalDamageTaken}\n` +
        `${STAT_EMOJI.KILL} Убито монстров: ${playerStats.monstersKilled}\n` +
        `${STAT_EMOJI.ITEMS} Найдено предметов: ${playerStats.itemsFound}\n` +
        `${STAT_EMOJI.COINS} Куплено предметов: ${playerStats.itemsPurchased}\n` +
        `${STAT_EMOJI.PORTAL} Использовано порталов: ${playerStats.portalsUsed}\n` +
        `${STAT_EMOJI.COINS} Монет: ${playerStats.totalCoins}\n` +
        `${STAT_EMOJI.LEVEL} Максимальный уровень: ${playerStats.maxHeroLevel}`;
}

// Обновление статистики текущего игрока
function updatePlayerStats(session, options) {
    const ps = session.playerStats;
    if (options.damageDealt) ps.totalDamageDealt += options.damageDealt;
    if (options.damageTaken) ps.totalDamageTaken += options.damageTaken;
    if (options.monsterKilled) ps.monstersKilled++;
    if (options.itemFound) ps.itemsFound++;
    if (options.gameCompleted) ps.gamesCompleted++;
    if (options.coinsGained) ps.totalCoins += options.coinsGained;
    if (options.heroLevel && options.heroLevel > ps.maxHeroLevel) {
        ps.maxHeroLevel = options.heroLevel;
    }
    if (options.questCompleted) ps.questsCompleted++;
    if (options.itemPurchased) ps.itemsPurchased++;
    if (options.portalUsed) ps.portalsUsed++;
    if (options.death) ps.deaths++;
}

// One game session per chat (in-memory only).
// Different chats can play simultaneously without interfering.
const sessions = new Map();

// Создание новой игровой сессии для чата
function createNewSession(chatId) {
    const session = {
        chatId,
        world: new WorldGenerator(),
        player: new Player(),
        combatState: false,
        mode: 'mobile',
        playerStats: {
            gamesCompleted: 0,
            totalDamageDealt: 0,
            totalDamageTaken: 0,
            monstersKilled: 0,
            itemsFound: 0,
            maxHeroLevel: 1,
            totalCoins: 0,
            questsCompleted: 0,
            itemsPurchased: 0,
            portalsUsed: 0,
            deaths: 0,
        },
    };
    sessions.set(chatId, session);
    return session;
}

// Получение существующей сессии или создание новой
function getSession(chatId) {
    return sessions.get(chatId) ?? createNewSession(chatId);
}

// Настройка новой игры (генерация мира, игрока)
function setupNewGame(session, { width, height, playerName, mode }) {
    session.mode = mode;
    session.combatState = false;

    session.world.setup(width, height);
    session.world.generate();

    session.player.setup(width, height, playerName);
    session.player.clearAttributes();
    session.player.setRandomLocation();

    initEvent();

    const x = session.player.getX();
    const y = session.player.getY();
    session.world.generateNPC(x, y);
    session.world.generateMerchant(x, y);
    session.world.generateQuestGiver(x, y);
    session.world.generateItems(x, y);
    session.world.generatePortals(x, y);
    
    session.player.markCellVisited(x, y);

    return { x, y };
}

const bot = new TelegramBot(process.env.BOT_TOKEN, {
    polling: {
        interval: 300, // Опционально: интервал опроса в мс
        autoStart: false,
    },
});

bot.on('polling_error', (error) => {
    const msg = error?.message || String(error);
    if (msg.includes('409') || msg.toLowerCase().includes('conflict')) {
        console.error(
            '[WARN] Telegram API 409 Conflict: another getUpdates request is active.'
        );
        console.error(
            'This is not a code error. Stop other bot instances (or remove webhook) and restart.'
        );
        return;
    }

    console.error('Polling error:', error);
});

bot.on('webhook_error', (error) => {
    console.error('Webhook error:', error);
});

const mainMenu = [
    { command: 'start', description: 'Начать игру на мобильном' },
    { command: 'pc', description: 'Начать игру на компьютере' },
    { command: 'info', description: 'Статистика игры' },
    { command: 'help', description: 'Помощь' },
];
await bot.setMyCommands(mainMenu).catch(e => console.error('[WARN] setMyCommands failed:', e));

try {
    const me = await bot.getMe();
    console.log(`Bot identity: @${me.username} (id: ${me.id})`);
} catch (e) {
    console.error('[WARN] bot.getMe() failed:', e);
}

try {
    await bot.startPolling();
    console.log('Polling started. Bot is running and waiting for updates...');
} catch (e) {
    console.error('[FATAL] Failed to start polling:', e);
    process.exit(1);
}

// Генерация Inline-кнопок для навигации и действий
function generateInlineButtons(availableDirections, availableActions) {
    // Фильтруем кнопки по доступным направлениям
    const generatedMoveButtons = [];

    for (const dir of availableDirections) {
        if (TG_MOVE_DIRECTIONS[dir]) {
            generatedMoveButtons.push({
                text: TG_MOVE_DIRECTIONS[dir].text,
                callback_data: TG_MOVE_DIRECTIONS[dir].callback,
            });
        }
    }

    const generatedActionButtons = [];
    for (const oneAction of availableActions) {
        if (TG_ACTIONS[oneAction]) {
            generatedActionButtons.push({
                text: TG_ACTIONS[oneAction].text,
                callback_data: TG_ACTIONS[oneAction].callback,
            });
        }
    }

    // console.log('action buttons:', generatedActionButtons);

    return {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [generatedMoveButtons, generatedActionButtons],
        },
    };
}

// Генерация кнопки "Новая игра" после смерти игрока
function generateDeathButtons() {
    return {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[{ text: 'Новая игра', callback_data: 'new_game' }]],
        },
    };
}

// ================= START on Mobile ===================
// start
bot.onText(/\/start/, (msg) => {
    const session = createNewSession(msg.chat.id);
    const { x, y } = setupNewGame(session, {
        width: WORLD_MOBILE_WIDTH,
        height: WORLD_MOBILE_HEIGHT,
        playerName: msg.from.first_name,
        mode: 'mobile',
    });
    console.log(`Игрок ${msg.from.first_name} (ID: ${msg.chat.id}) сгенерировал карту ${WORLD_MOBILE_WIDTH}x${WORLD_MOBILE_HEIGHT}`);
    updateGlobalStats({ playerId: msg.chat.id, worldName: session.world.worldName, gamesStarted: 1 });

    const buttons = generateInlineButtons(
        session.world.getAvailableDirections(x, y),
        session.world.getAvailableActions(x, y)
    );

    const message =
        `${STAT_EMOJI.ATTACK} Добро пожаловать в *Текстовое Приключение!* ${STAT_EMOJI.ATTACK}\n\n` +
        msg.from.first_name +
        `, вы - отважный искатель приключений в мрачном мире. Ваша цель - исследовать руины, ` +
        `сражаться с монстрами и находить сокровища.\n\n` +
        session.world.GetLocationText(x, y, session.player) +
        session.player.getLocationCoords() +
        session.world.printWorldMap(x, y);

    bot.sendMessage(msg.chat.id, message, buttons);
});

// ================= START on PC ===================
// start
bot.onText(/\/pc/, (msg) => {
    const session = createNewSession(msg.chat.id);
    const { x, y } = setupNewGame(session, {
        width: WORLD_PC_WIDTH,
        height: WORLD_PC_HEIGHT,
        playerName: msg.from.first_name,
        mode: 'pc',
    });
    console.log(`Игрок ${msg.from.first_name} (ID: ${msg.chat.id}) сгенерировал карту ${WORLD_PC_WIDTH}x${WORLD_PC_HEIGHT}`);
    updateGlobalStats({ playerId: msg.chat.id, worldName: session.world.worldName, gamesStarted: 1 });

    const buttons = generateInlineButtons(
        session.world.getAvailableDirections(x, y),
        session.world.getAvailableActions(x, y)
    );

    const message =
        `${STAT_EMOJI.ATTACK} Добро пожаловать в *Текстовое Приключение!* ${STAT_EMOJI.ATTACK}\n\n` +
        msg.from.first_name +
        `, вы - отважный искатель приключений в мрачном мире. Ваша цель - исследовать руины, ` +
        `сражаться с монстрами и находить сокровища.\n\n` +
        session.world.GetLocationText(x, y, session.player) +
        session.player.getLocationCoords() +
        session.world.printWorldMap(x, y);

    bot.sendMessage(msg.chat.id, message, buttons);
});

// ================= HELP ===================
// help
bot.onText(/\/help/, (msg) => {
    const session = getSession(msg.chat.id);
    const playerName = msg.from.first_name;

    const sizes =
        session.mode === 'pc'
            ? { w: WORLD_PC_WIDTH, h: WORLD_PC_HEIGHT, mode: 'pc' }
            : { w: WORLD_MOBILE_WIDTH, h: WORLD_MOBILE_HEIGHT, mode: 'mobile' };

    const { x, y } = setupNewGame(session, {
        width: sizes.w,
        height: sizes.h,
        playerName,
        mode: sizes.mode,
    });
    console.log(`Игрок ${playerName} (ID: ${msg.chat.id}) сгенерировал карту ${sizes.w}x${sizes.h}`);

    const buttons = generateInlineButtons(
        session.world.getAvailableDirections(x, y),
        session.world.getAvailableActions(x, y)
    );

    const message =
        `${STAT_EMOJI.ATTACK} *Добро пожаловать в Текстовое Подземелье!*\n\n` +
        msg.from.first_name +
        `, вы - отважный искатель приключений в мрачном мире. Ваша цель - исследовать руины, ` +
        `сражаться с монстрами и находить сокровища.\n\n` +
        session.world.GetLocationText(x, y, session.player) +
        session.player.getLocationCoords() +
        session.world.printWorldMap(x, y);

    bot.sendMessage(msg.chat.id, message, buttons);
});

// ================= INFO ===================
bot.onText(/\/info/, (msg) => {
    const session = getSession(msg.chat.id);
    const message = getGlobalStatsMessage(session.playerStats);
    bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
});

// Защита от спама: время последнего callback для каждого чата
const lastCallbackTime = new Map();
const CALLBACK_COOLDOWN = 500; // мс между обработкой callback от одного чата

// ================= CALLBACK QUERY ===================
// Обработка Inline-кнопок
bot.on('callback_query', (query) => {
    if (!query.data) return;
    
    const action = query.data;
    const currentChatID = query.message.chat.id;
    
    // Защита от спама
    const lastTime = lastCallbackTime.get(currentChatID) || 0;
    if (Date.now() - lastTime < CALLBACK_COOLDOWN) {
        bot.answerCallbackQuery(query.id, { text: 'Подождите...' });
        return;
    }
    lastCallbackTime.set(currentChatID, Date.now());
    
    const session = getSession(currentChatID);
    const world = session.world;
    const player = session.player;

    // Проверка что игра инициализирована
    if (!world.maze || world.maze.length === 0 || !player.maxWidth) {
        bot.answerCallbackQuery(query.id, { text: 'Начните новую игру!' });
        return;
    }

    // ================== NEW GAME ======================
    if (action === 'new_game') {
        session.world = new WorldGenerator();
        session.player = new Player();
        session.combatState = false;
        session.playerStats = {
            gamesCompleted: 0,
            totalDamageDealt: 0,
            totalDamageTaken: 0,
            monstersKilled: 0,
            itemsFound: 0,
            maxHeroLevel: 1,
            totalCoins: 0,
        };

        const width = session.mode === 'pc' ? WORLD_PC_WIDTH : WORLD_MOBILE_WIDTH;
        const height = session.mode === 'pc' ? WORLD_PC_HEIGHT : WORLD_MOBILE_HEIGHT;

        session.world.setup(width, height);
        session.world.generate();
        session.player.setup(width, height, player.name);
        session.player.clearAttributes();
        session.player.setRandomLocation();

        const px = session.player.getX();
        const py = session.player.getY();
        session.world.generateNPC(px, py);
        session.world.generateMerchant(px, py);
        session.world.generateQuestGiver(px, py);
        session.world.generateItems(px, py);
        session.world.generatePortals(px, py);
        session.player.markCellVisited(px, py);

        updateGlobalStats({ 
            playerId: currentChatID, 
            worldName: session.world.worldName, 
            gamesStarted: 1 
        });

        const buttons = generateInlineButtons(
            session.world.getAvailableDirections(px, py),
            session.world.getAvailableActions(px, py)
        );

        const message =
            `${STAT_EMOJI.ATTACK} Новая игра началась! ${STAT_EMOJI.ATTACK}\n\n` +
            session.world.GetLocationText(px, py, session.player) +
            session.player.getLocationCoords() +
            session.world.printWorldMap(px, py);

        bot.editMessageText(message, {
            chat_id: currentChatID,
            message_id: query.message.message_id,
            parse_mode: 'Markdown',
            reply_markup: JSON.stringify(buttons.reply_markup)
        });

        bot.answerCallbackQuery(query.id);
        return;
    }

    let message = '';

    let x = player.getX();
    let y = player.getY();

    // ================== MOVE ======================
    if (
        action === 'move_up' ||
        action === 'move_down' ||
        action === 'move_left' ||
        action === 'move_right'
    ) {
        let moved = false;
        const oldX = player.getX();
        const oldY = player.getY();
        
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

        x = player.getX();
        y = player.getY();

        const directionNames = {
            'move_up': 'Север',
            'move_down': 'Юг',
            'move_left': 'Запад',
            'move_right': 'Восток'
        };
        const directionName = directionNames[action] || 'неизвестное направление';

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
                    chat_id: currentChatID,
                    message_id: query.message.message_id,
                    reply_markup: JSON.stringify({ inline_keyboard: [] }),
                    parse_mode: 'Markdown'
                });
            }
        } else {
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

            const buttons = isPlayerDied 
                ? generateDeathButtons()
                : generateInlineButtons(
                    world.getAvailableDirections(x, y),
                    world.getAvailableActions(x, y)
                );

            if (query.message) {
                bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
                    chat_id: currentChatID,
                    message_id: query.message.message_id,
                });
            }

            bot.sendMessage(currentChatID, message, buttons);
        }
    }

    // ============ USE ===============
    if (action === 'use') {
        message = '';

        x = player.getX();
        y = player.getY();

        const itemsToUse = world.getItemsAtLocation(x, y);
        if (itemsToUse.length === 0) {
            message =
                'На локации нет предметов.\n\n' +
                world.GetLocationText(x, y, player) +
                player.getLocationCoords() +
                world.printWorldMap(x, y);

            const buttons = generateInlineButtons(
                world.getAvailableDirections(x, y),
                world.getAvailableActions(x, y)
            );

            bot.sendMessage(currentChatID, message, buttons);
            bot.answerCallbackQuery(query.id);
            return;
        }
        const oneItemToUse =
            itemsToUse[Math.floor(Math.random() * itemsToUse.length)];
        const useResult = player.useItem(oneItemToUse);
        message = useResult.text;
        
        const expResult = player.addExperienceForAction(1);
        message += `✨ Опыт: +${expResult.gained}\n`;
        if (expResult.leveledUp && expResult.statsGained) {
            message += `${STAT_EMOJI.LEVEL_UP} *ПОВЫШЕНИЕ УРОВНЯ!*\n`;
            message += `${STAT_EMOJI.HEALTH} Здоровье увеличено на ${expResult.statsGained.hpBonus}\n`;
            message += `${STAT_EMOJI.ATTACK} Атака увеличена на ${expResult.statsGained.minAttackBonus}\n`;
        }
        message += '\n' + player.getPlayerDescription();
        
        const indexToRemove = world.items.findIndex(
            (item) => item === oneItemToUse
        );
        world.items.splice(indexToRemove, 1);
        updateGlobalStats({ itemFound: true, heroLevel: player.heroLevel });
        updatePlayerStats(session, { itemFound: true, heroLevel: player.heroLevel, coinsGained: useResult.coinsGained });

        const npcsAtLocation = world.getNPCsAtLocation(x, y);
        const agressiveNPCs = npcsAtLocation.filter(npc => npc.isAggressive());
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
            world.printWorldMap(x, y);

        const buttons = isPlayerDied 
            ? generateDeathButtons()
            : generateInlineButtons(
                world.getAvailableDirections(x, y),
                world.getAvailableActions(x, y)
            );

        if (query.message) {
            bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
                chat_id: currentChatID,
                message_id: query.message.message_id,
            });
        }
        
        bot.sendMessage(currentChatID, message, buttons);
    }

    // ============ ATTACK ===============
    if (action === 'attack') {
        session.combatState = true;
        message = '';
        x = player.getX();
        y = player.getY();

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
                    chat_id: currentChatID,
                    message_id: query.message.message_id,
                });
            }
            
            bot.sendMessage(currentChatID, message, buttons);
            bot.answerCallbackQuery(query.id);
            return;
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
                chat_id: currentChatID,
                message_id: query.message.message_id,
            });
        }

        bot.sendMessage(currentChatID, message, buttons);
    }

    // ============ BUY ===============
    if (action === 'buy') {
        message = '';
        x = player.getX();
        y = player.getY();

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
            world.printWorldMap(x, y);

        const buttons = generateInlineButtons(
            world.getAvailableDirections(x, y),
            world.getAvailableActions(x, y)
        );

        if (query.message) {
            bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
                chat_id: currentChatID,
                message_id: query.message.message_id,
            });
        }

        bot.sendMessage(currentChatID, message, buttons);
    }

    // ============ HELP ===============
    if (action === 'help') {
        message = '';
        x = player.getX();
        y = player.getY();
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
                questGiverFound.agressive = true;
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
            message +=
                '\n' +
                world.GetLocationText(x, y, player) +
                player.getLocationCoords() +
                world.printWorldMap(x, y);
        }

        const buttons = playerDied
            ? generateDeathButtons()
            : generateInlineButtons(
                world.getAvailableDirections(x, y),
                world.getAvailableActions(x, y)
            );

        if (query.message) {
            bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
                chat_id: currentChatID,
                message_id: query.message.message_id,
            });
        }

        bot.sendMessage(currentChatID, message, buttons);
    }

    // ============ PORTAL ===============
    if (action === 'portal') {
        message = '';
        x = player.getX();
        y = player.getY();

        const portal = world.getPortalAtLocation(x, y);

        if (!portal) {
            message += 'Здесь нет портала.\n';
        } else {
            updatePlayerStats(session, { portalUsed: true });
            updateGlobalStats({ portalUsed: true });
            
            if (portal.isWorldPortal) {
                message += `${STAT_EMOJI.PORTAL} Вы вошли в портал...\n\n`;

                const width = session.mode === 'pc' ? WORLD_PC_WIDTH : WORLD_MOBILE_WIDTH;
                const height = session.mode === 'pc' ? WORLD_PC_HEIGHT : WORLD_MOBILE_HEIGHT;

                world.setup(width, height);
                world.generate();
                player.setup(width, height, player.name);
                player.clearAttributes();
                player.setRandomLocation();

                const nx = player.getX();
                const ny = player.getY();
                world.generateNPC(nx, ny);
                world.generateMerchant(nx, ny);
                world.generateQuestGiver(nx, ny);
                world.generateItems(nx, ny);
                world.generatePortals(nx, ny);
                player.markCellVisited(nx, ny);

                world.recalculateNPCsForLevel(player.heroLevel);

                message += `Вы прибыли в новый мир: *${world.worldName}*\n\n`;

                const locationMessage =
                    world.GetLocationText(nx, ny, player) +
                    player.getLocationCoords() +
                    world.printWorldMap(nx, ny);
                message += locationMessage;

                updateGlobalStats({ worldChange: true });
            } else {
                let newX, newY;
                do {
                    newX = Math.floor(Math.random() * world.width);
                    newY = Math.floor(Math.random() * world.height);
                } while (newX === x && newY === y);

                player.setPosition(newX, newY);
                message += `${STAT_EMOJI.PORTAL} Вы зашли в портал и телепортировались в случайную точку мира!\n\n`;
                
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

                const locationMessage =
                    world.GetLocationText(newX, newY, player) +
                    player.getLocationCoords() +
                    world.printWorldMap(newX, newY);
                message += locationMessage;
            }
        }

        message += player.getPlayerDescription() + '\n';

        const buttons = generateInlineButtons(
            world.getAvailableDirections(player.getX(), player.getY()),
            world.getAvailableActions(player.getX(), player.getY())
        );

        if (query.message) {
            bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
                chat_id: currentChatID,
                message_id: query.message.message_id,
            });
        }

        bot.sendMessage(currentChatID, message, buttons);
    }

    bot.answerCallbackQuery(query.id);
});
