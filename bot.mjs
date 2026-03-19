// bot.mjs
// > npm run dev
// > npm start

import TelegramBot from 'node-telegram-bot-api';
import { WorldGenerator } from './src/World.mjs';
import { Player } from './src/Player.mjs';
import { Item } from './src/Item.mjs';
import { initEvent } from './src/EventSystem.mjs';
import { PORTAL_SETTINGS, DEBUG_MERCHANT_QUEST_MASS_SPAWN, DEBUG_LOG_SPAWN, PLAYER_SETTINGS } from './src/GameSetup.mjs';
import { NPC_TYPE } from './src/NPC.mjs';
import { STAT_EMOJI } from './src/TextEnums/SmileInText.mjs';
import { TG_MOVE_DIRECTIONS, TG_ACTIONS } from './src/TelegramAPIConstants.mjs';
import { generateInlineButtons, generateDeathButtons } from './src/TelegramButtons.mjs';
import { handleMovement, handleCombat, handleItemUse, handleTakeAllItems, handleBuy, handleHelp, handlePortal, startRiddleSession, handleRiddleAnswer, getCurrentRiddle, isRiddleActive } from './src/handlers/index.mjs';
import dotenv from 'dotenv';

dotenv.config();

// Обработчик необработанных ошибок (Telegram API может выбрасывать их при одновременных запросах)
process.on('unhandledRejection', (reason, promise) => {
    if (reason && reason.message && reason.message.includes('message is not modified')) {
        return; // Игнорируем эту ошибку
    }
    console.error('[UNHANDLED REJECTION]', reason);
});

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

const WORLD_MOBILE_WIDTH = 13;
const WORLD_MOBILE_HEIGHT = 10;
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
    if (options.questCompleted) ps.questCompleted++;
    if (options.itemPurchased) ps.itemsPurchased++;
    if (options.portalUsed) ps.portalsUsed++;
    if (options.death) ps.deaths++;
}

const sessions = new Map();

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

function getSession(chatId) {
    if (!sessions.has(chatId)) {
        return createNewSession(chatId);
    }
    return sessions.get(chatId);
}

function setupNewGame(session, options) {
    session.world.setup(options.width, options.height);
    session.world.generate();
    session.player.setup(options.width, options.height, options.playerName);
    session.player.clearAttributes();
    session.player.setRandomLocation();

    initEvent();

    const x = session.player.getX();
    const y = session.player.getY();
    session.world.generateNPC(x, y);
    session.world.generateMerchant(x, y);
    session.world.generateQuestGiver(x, y);
    session.world.generateStoryteller(x, y);
    session.world.generateItems(x, y);
    session.world.generatePortals(x, y);
    session.world.setPortalHintsForQuestGivers();
    session.world.generateBoss(x, y);
    session.player.markCellVisited(x, y);
    session.player.markAreaVisible(x, y, PLAYER_SETTINGS.VISIBILITY_WIDTH, PLAYER_SETTINGS.VISIBILITY_HEIGHT);

    if (DEBUG_MERCHANT_QUEST_MASS_SPAWN || DEBUG_LOG_SPAWN) {
        const npcs = session.world.npcs;
        const merchants = npcs.filter(n => n.npcType === NPC_TYPE.MERCHANT);
        const questGivers = npcs.filter(n => n.npcType === NPC_TYPE.QUEST_GIVER);
        const storytellers = npcs.filter(n => n.npcType === NPC_TYPE.STORYTELLER);
        const aggressive = npcs.filter(n => n.npcType === NPC_TYPE.AGGRESSIVE);
        const neutral = npcs.filter(n => n.npcType === NPC_TYPE.NEUTRAL);
        const bosses = npcs.filter(n => n.npcType === NPC_TYPE.BOSS);

        console.log(`[DEBUG] === WORLD SPAWN STATS ===`);
        console.log(`[DEBUG] NPCs: ${npcs.length}`);
        console.log(`[DEBUG]   Aggressive: ${aggressive.length}`);
        console.log(`[DEBUG]   Neutral: ${neutral.length + merchants.length + questGivers.length + storytellers.length} (Neutral creatures: ${neutral.length}, Merchants: ${merchants.length}, Quest Givers: ${questGivers.length}, Storytellers: ${storytellers.length})`);
        if (bosses.length > 0) {
            console.log(`[DEBUG]   Bosses: ${bosses.length}`);
        }
        console.log(`[DEBUG] Portals: ${session.world.portals.length}`);
        console.log(`[DEBUG] Items: ${session.world.items.length}`);
        const weapons = session.world.items.filter(i => i.isWeapon).length;
        const healing = session.world.items.filter(i => i.isHealing).length;
        const coins = session.world.items.filter(i => i.isCoin).length;
        console.log(`[DEBUG]   Weapons: ${weapons}, Healing: ${healing}, Coins: ${coins}`);
    }

    return { x, y };
}

// ================= BOT ===================

const bot = new TelegramBot(process.env.BOT_TOKEN, {
    polling: {
        interval: 300,
        autoStart: false,
    },
});

// ================= START on Mobile ===================
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
        session.world.printWorldMap(x, y, session.player);

    bot.sendMessage(msg.chat.id, message, buttons);
});

// ================= START on PC ===================
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
        session.world.printWorldMap(x, y, session.player);

    bot.sendMessage(msg.chat.id, message, buttons);
});

// ================= HELP ===================
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
        session.world.printWorldMap(x, y, session.player);

    bot.sendMessage(msg.chat.id, message, buttons);
});

// ================= INFO ===================
bot.onText(/\/info/, (msg) => {
    const session = getSession(msg.chat.id);
    const message = getGlobalStatsMessage(session.playerStats);
    bot.sendMessage(msg.chat.id, message, { parse_mode: 'Markdown' });
});

// Защита от спама
const lastCallbackTime = new Map();
const CALLBACK_COOLDOWN = 500;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomDelay() {
    return 200 + Math.floor(Math.random() * 800);
}

// ================= CALLBACK QUERY ===================
bot.on('callback_query', async (query) => {
    if (!query.data) return;
    
    await delay(getRandomDelay());
    
    const action = query.data;
    const currentChatID = query.message.chat.id;
    
    const lastTime = lastCallbackTime.get(currentChatID) || 0;
    if (Date.now() - lastTime < CALLBACK_COOLDOWN) {
        bot.answerCallbackQuery(query.id, { text: 'Подождите...' });
        return;
    }
    lastCallbackTime.set(currentChatID, Date.now());
    
    const session = getSession(currentChatID);
    const world = session.world;
    const player = session.player;

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
            questsCompleted: 0,
            itemsPurchased: 0,
            portalsUsed: 0,
            deaths: 0,
        };

        const { x, y } = setupNewGame(session, {
            width: session.mode === 'pc' ? WORLD_PC_WIDTH : WORLD_MOBILE_WIDTH,
            height: session.mode === 'pc' ? WORLD_PC_HEIGHT : WORLD_MOBILE_HEIGHT,
            playerName: player.name,
            mode: session.mode,
        });

        updateGlobalStats({ 
            playerId: currentChatID, 
            worldName: session.world.worldName, 
            gamesStarted: 1 
        });

        const buttons = generateInlineButtons(
            session.world.getAvailableDirections(x, y),
            session.world.getAvailableActions(x, y)
        );

        const message =
            `${STAT_EMOJI.ATTACK} Новая игра началась! ${STAT_EMOJI.ATTACK}\n\n` +
            session.world.GetLocationText(x, y, session.player) +
            session.player.getLocationCoords() +
            session.world.printWorldMap(x, y, session.player);

        bot.editMessageText(message, {
            chat_id: currentChatID,
            message_id: query.message.message_id,
            parse_mode: 'Markdown',
            reply_markup: JSON.stringify(buttons.reply_markup)
        });

        bot.answerCallbackQuery(query.id);
        return;
    }

    // Параметры для handlers
    const handlerParams = {
        session,
        player,
        world,
        action,
        query,
        bot,
        STAT_EMOJI,
        updateGlobalStats,
        updatePlayerStats,
        generateInlineButtons,
        generateDeathButtons,
        WORLD_MOBILE_WIDTH,
        WORLD_MOBILE_HEIGHT,
        WORLD_PC_WIDTH,
        WORLD_PC_HEIGHT,
    };

    let result = { message: '', buttons: null, removeKeyboard: false, editOnly: false };

    // ================== MOVE ======================
    if (action === 'move_up' || action === 'move_down' || action === 'move_left' || action === 'move_right') {
        result = handleMovement(handlerParams);
    }
    // ============ USE ===============
    else if (action === 'use') {
        session.combatState = false;
        result = handleItemUse(handlerParams);
    }
    // ============ TAKE ALL ===============
    else if (action === 'take_all') {
        session.combatState = false;
        result = handleTakeAllItems(handlerParams);
    }
    // ============ ATTACK ===============
    else if (action === 'attack') {
        session.combatState = true;
        result = handleCombat(handlerParams);
    }
    // ============ BUY ===============
    else if (action === 'buy') {
        result = handleBuy(handlerParams);
    }
    // ============ HELP ===============
    else if (action === 'help') {
        result = handleHelp(handlerParams);
    }
    // ============ PORTAL ===============
    else if (action === 'portal') {
        result = handlePortal(handlerParams);
    }
    // ============ PUZZLE ===============
    else if (action === 'puzzle') {
        const riddleResult = startRiddleSession(session, world, player.getX(), player.getY());
        if (riddleResult.success) {
            const riddleInfo = getCurrentRiddle({
                session,
                world,
                STAT_EMOJI,
                generateInlineButtons
            });
            result = { 
                message: riddleInfo.message, 
                buttons: riddleInfo.buttons,
                removeKeyboard: false,
                editOnly: false
            };
        } else {
            result = { message: riddleResult.error, buttons: null, removeKeyboard: false };
        }
    }
    // ============ RIDDLE ANSWER ===============
    else if (action.startsWith('riddle_answer_')) {
        const answerIndex = parseInt(action.replace('riddle_answer_', ''), 10);
        
        if (isRiddleActive(session)) {
            const state = session.riddleState;
            const currentRiddle = state.riddles[state.currentIndex];
            const selectedAnswer = currentRiddle.answers[answerIndex];
            
            const riddleResult = handleRiddleAnswer({
                session,
                player,
                world,
                answer: selectedAnswer,
                updateGlobalStats,
                updatePlayerStats,
                STAT_EMOJI
            });
            
            if (riddleResult.riddleEnded) {
                const locX = riddleResult.x !== undefined ? riddleResult.x : player.getX();
                const locY = riddleResult.y !== undefined ? riddleResult.y : player.getY();
                result = {
                    message: riddleResult.message,
                    buttons: generateInlineButtons(
                        world.getAvailableDirections(locX, locY),
                        world.getAvailableActions(locX, locY)
                    ),
                    removeKeyboard: false
                };
            } else {
                const nextRiddle = getCurrentRiddle({
                    session,
                    world,
                    STAT_EMOJI,
                    generateInlineButtons
                });
                result = {
                    message: riddleResult.message + '\n\n' + nextRiddle.message,
                    buttons: nextRiddle.buttons,
                    removeKeyboard: false
                };
            }
        } else {
            result = { message: 'Нет активной головоломки.', buttons: null, removeKeyboard: false };
        }
    }

    // Отправка результата
    if (result.message || result.removeKeyboard) {
        if (result.editOnly && query.message && result.message) {
            bot.editMessageText(result.message, {
                chat_id: currentChatID,
                message_id: query.message.message_id,
                parse_mode: 'Markdown',
                reply_markup: JSON.stringify(result.buttons ? result.buttons.reply_markup : { inline_keyboard: [] })
            }).catch(() => {});
        } else {
            if (query.message) {
                bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
                    chat_id: currentChatID,
                    message_id: query.message.message_id,
                }).catch(() => {});
            }
            if (result.message) {
                bot.sendMessage(currentChatID, result.message, result.buttons);
            }
        }
    }

    bot.answerCallbackQuery(query.id);
});

// Запуск бота
bot.on('polling_error', (error) => {
    console.error('[POLLING ERROR]', error);
});

bot.startPolling();
console.log('Bot started and waiting for messages...');
