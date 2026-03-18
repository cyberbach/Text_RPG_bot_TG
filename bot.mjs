// bot.mjs
// > npm run dev
// > npm start

import TelegramBot from 'node-telegram-bot-api';
import { WorldGenerator } from './src/World.mjs';
import { Player } from './src/Player.mjs';
import { allAgressiveNPCAttackPlayer, playerAttackNPC } from './src/Game.mjs';
import { DIRECTIONS } from './src/MovementDirections.mjs';
import { TG_MOVE_DIRECTIONS, TG_ACTIONS } from './src/TelegramAPIConstants.mjs';
import { initEvent, getCurrentEventName, tickEventDuration, getHitChanceModifier } from './src/EventSystem.mjs';
import { STAT_EMOJI } from './src/SmileInText.mjs';
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
}

// Формирование сообщения со статистикой
function getGlobalStatsMessage(playerStats) {
    return `📊 *ГЛОБАЛЬНАЯ СТАТИСТИКА*\n\n` +
        `${STAT_EMOJI.GAME} Всего игр начато: ${globalStats.totalGamesStarted}\n` +
        `${STAT_EMOJI.MONSTER} Уникальных игроков: ${globalStats.uniquePlayers.size}\n` +
        `${STAT_EMOJI.WORLD_MAP} Миров создано: ${globalStats.worldsVisited.size}\n` +
        `${STAT_EMOJI.CHECK} Игр пройдено: ${globalStats.gamesCompleted}\n` +
        `${STAT_EMOJI.ATTACK} Всего урона нанесено: ${globalStats.totalDamageDealt}\n` +
        `${STAT_EMOJI.ARMOR} Всего урона получено: ${globalStats.totalDamageTaken}\n` +
        `${STAT_EMOJI.KILL} Всего монстров убито: ${globalStats.monstersKilled}\n` +
        `${STAT_EMOJI.ITEMS} Всего предметов найдено: ${globalStats.itemsFound}\n` +
        `${STAT_EMOJI.COINS} Всего монет: ${globalStats.totalCoins}\n` +
        `${STAT_EMOJI.LEVEL} Максимальный уровень: ${globalStats.maxHeroLevel}\n\n` +
        `📈 *СТАТИСТИКА ИГРОКА*\n\n` +
        `${STAT_EMOJI.CHECK} Игр пройдено: ${playerStats.gamesCompleted}\n` +
        `${STAT_EMOJI.ATTACK} Нанесено урона: ${playerStats.totalDamageDealt}\n` +
        `${STAT_EMOJI.ARMOR} Получено урона: ${playerStats.totalDamageTaken}\n` +
        `${STAT_EMOJI.KILL} Убито монстров: ${playerStats.monstersKilled}\n` +
        `${STAT_EMOJI.ITEMS} Найдено предметов: ${playerStats.itemsFound}\n` +
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
    session.world.generateItems(x, y);
    
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
        session.world.GetLocationText(x, y) +
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
        session.world.GetLocationText(x, y) +
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
        session.world.GetLocationText(x, y) +
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

// ================= CALLBACK QUERY ===================
// Обработка Inline-кнопок
bot.on('callback_query', (query) => {
    const action = query.data;
    const currentChatID = query.message.chat.id;
    const session = getSession(currentChatID);
    const world = session.world;
    const player = session.player;

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
        session.world.generateItems(px, py);
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
            session.world.GetLocationText(px, py) +
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
                world.GetLocationText(x, y) +
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
            const agressiveNPCsOnOldLocation = npcsOnOldLocation.filter(npc => npc.agressive);
            
            const expResult = player.addExperienceForAction(1);
            if (expResult.leveledUp && expResult.statsGained) {
                message += `${STAT_EMOJI.LEVEL_UP} *ПОВЫШЕНИЕ УРОВНЯ!*\n`;
                message += `${STAT_EMOJI.HEALTH} Здоровье увеличено на ${expResult.statsGained.hpBonus}\n`;
                message += `${STAT_EMOJI.ATTACK} Атака увеличена на ${expResult.statsGained.minAttackBonus}\n\n`;
            }

            if (agressiveNPCsOnOldLocation.length > 0) {
                const npcAttackResult = allAgressiveNPCAttackPlayer(world, player, oldX, oldY);
                message += npcAttackResult.text;
                updateGlobalStats({ damageTaken: npcAttackResult.stats.damageTaken });
                updatePlayerStats(session, { damageTaken: npcAttackResult.stats.damageTaken });
                
                if (npcAttackResult.stats.playerDied) {
                    updateGlobalStats({ gameCompleted: true });
                    updatePlayerStats(session, { gameCompleted: true });
                    message += '\n' + STAT_EMOJI.DEAD + ' ВЫ ПОГИБЛИ! Игра окончена.\nНажмите /start чтобы начать заново.';
                } else {
                    message += player.getPlayerDescription() + '\n';
                }
            }

            let isPlayerDied = false;
            if (agressiveNPCsOnOldLocation.length > 0) {
                const npcAttackResult = allAgressiveNPCAttackPlayer(world, player, oldX, oldY);
                isPlayerDied = npcAttackResult.stats.playerDied;
            }

            if (!player.isCellVisited(x, y)) {
                world.recalculateNPCsForLevel(player.heroLevel);
                player.markCellVisited(x, y);
            }

            tickEventDuration();

            const locationMessage =
                world.GetLocationText(x, y) +
                player.getLocationCoords() +
                world.printWorldMap(x, y);

            const hitChance = player.getHitChance(getHitChanceModifier());
            const weatherInfo = `${getCurrentEventName()} ${STAT_EMOJI.ACCURACY}${hitChance}% точности при атаке.`;
            message += `Вы перешли на ${directionName}. ${weatherInfo}\n\n` + locationMessage;

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
                world.GetLocationText(x, y) +
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
        message = player.useItem(oneItemToUse);
        player.addExperienceForAction(1);
        const indexToRemove = world.items.findIndex(
            (item) => item === oneItemToUse
        );
        world.items.splice(indexToRemove, 1);
        updateGlobalStats({ itemFound: true, heroLevel: player.heroLevel });
        updatePlayerStats(session, { itemFound: true, heroLevel: player.heroLevel });
        message += player.getPlayerDescription() + '\n';

        const npcsAtLocation = world.getNPCsAtLocation(x, y);
        const agressiveNPCs = npcsAtLocation.filter(npc => npc.agressive);
        let isPlayerDied = false;
        if (agressiveNPCs.length > 0) {
            const npcAttackResult = allAgressiveNPCAttackPlayer(world, player);
            message += '\n' + npcAttackResult.text;
            updateGlobalStats({ damageTaken: npcAttackResult.stats.damageTaken });
            updatePlayerStats(session, { damageTaken: npcAttackResult.stats.damageTaken });
            
            if (npcAttackResult.stats.playerDied) {
                isPlayerDied = true;
                updateGlobalStats({ gameCompleted: true });
                updatePlayerStats(session, { gameCompleted: true });
                message += '\n' + STAT_EMOJI.DEAD + ' ВЫ ПОГИБЛИ! Игра окончена.\nНажмите /start чтобы начать заново.';
            } else {
                message += player.getPlayerDescription() + '\n';
            }
        }

        message +=
            '\n' +
            world.GetLocationText(x, y) +
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
        if (Math.random() > 0.5) {
            playerAttackResult = playerAttackNPC(world, player);
            npcAttackResult = allAgressiveNPCAttackPlayer(world, player);
            message += playerAttackResult.text + npcAttackResult.text;
        } else {
            npcAttackResult = allAgressiveNPCAttackPlayer(world, player);
            playerAttackResult = playerAttackNPC(world, player);
            message += npcAttackResult.text + playerAttackResult.text;
        }

        updateGlobalStats({
            damageDealt: playerAttackResult.stats.damageDealt,
            monsterKilled: playerAttackResult.stats.monstersKilled > 0,
            damageTaken: npcAttackResult.stats.damageTaken,
            coinsGained: playerAttackResult.stats.coinsGained,
        });
        updateGlobalStats({ heroLevel: player.heroLevel });
        updatePlayerStats(session, {
            damageDealt: playerAttackResult.stats.damageDealt,
            monsterKilled: playerAttackResult.stats.monstersKilled > 0,
            damageTaken: npcAttackResult.stats.damageTaken,
            heroLevel: player.heroLevel,
            coinsGained: playerAttackResult.stats.coinsGained,
        });

        if (npcAttackResult.stats.playerDied) {
            updateGlobalStats({ gameCompleted: true });
            updatePlayerStats(session, { gameCompleted: true });
            session.combatState = false;
            message += '\n' + STAT_EMOJI.DEAD + ' ВЫ ПОГИБЛИ! Игра окончена.\nНажмите /start чтобы начать заново.';
        }

        message += '\n';
        let liveNPCs = world.getNPCsAtLocation(x, y);
        liveNPCs.forEach((npc) => {
            message += npc.getNpcDescription();
        });
        message += player.getPlayerDescription() + '\n';

        if (liveNPCs.length == 0) {
            session.combatState = false;
            message +=
                '\n' +
                world.GetLocationText(x, y) +
                // player.getLocationCoords() +
                world.printWorldMap(x, y);
        }

        if (!session.combatState) {
        }

        const buttons = npcAttackResult.stats.playerDied
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

    bot.answerCallbackQuery(query.id);
});
