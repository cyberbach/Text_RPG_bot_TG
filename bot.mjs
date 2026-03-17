// bot.mjs
// > npm run dev
// > npm start

import TelegramBot from 'node-telegram-bot-api';
import { WorldGenerator } from './src/World.mjs';
import { Player } from './src/Player.mjs';
import { AllAgressiveNPCAttackPlayer, PlayerAttackNPC } from './src/Game.mjs';
import { DIRECTIONS } from './src/MovementDirections.mjs';
import { TG_MOVE_DIRECTIONS, TG_ACTIONS } from './src/TelegramAPIConstants.mjs';
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

const WORLD_MOBILE_WIDTH = 4; // 13 максимум на телефоне
const WORLD_MOBILE_HEIGHT = 4; // 10
const WORLD_PC_WIDTH = 22;
const WORLD_PC_HEIGHT = 16;

// One game session per chat (in-memory only).
// Different chats can play simultaneously without interfering.
const sessions = new Map();

function createNewSession(chatId) {
    const session = {
        chatId,
        world: new WorldGenerator(),
        player: new Player(),
        combatState: false,
        mode: 'mobile',
    };
    sessions.set(chatId, session);
    return session;
}

function getSession(chatId) {
    return sessions.get(chatId) ?? createNewSession(chatId);
}

function setupNewGame(session, { width, height, playerName, mode }) {
    session.mode = mode;
    session.combatState = false;

    session.world.setup(width, height);
    session.world.generate();

    session.player.setup(width, height, playerName);
    session.player.clearAttributes();
    session.player.setRandomLocation();

    const x = session.player.getX();
    const y = session.player.getY();
    session.world.generateNPC(x, y);
    session.world.generateItems(x, y);

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
    { command: 'help', description: 'Помощь' },
];
await bot.setMyCommands(mainMenu);

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
            console.log('add attack button');
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

    const buttons = generateInlineButtons(
        session.world.getAvailableDirections(x, y),
        session.world.getAvailableActions(x, y)
    );

    const message =
        `⚔️ Добро пожаловать в *Текстовое Приключение!* ⚔️\n\n` +
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

    const buttons = generateInlineButtons(
        session.world.getAvailableDirections(x, y),
        session.world.getAvailableActions(x, y)
    );

    const message =
        `⚔️ Добро пожаловать в *Текстовое Приключение!* ⚔️\n\n` +
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

    const buttons = generateInlineButtons(
        session.world.getAvailableDirections(x, y),
        session.world.getAvailableActions(x, y)
    );

    const message =
        `⚔️ *Добро пожаловать в Текстовое Подземелье!*\n\n` +
        msg.from.first_name +
        `, вы - отважный искатель приключений в мрачном мире. Ваша цель - исследовать руины, ` +
        `сражаться с монстрами и находить сокровища.\n\n` +
        session.world.GetLocationText(x, y) +
        session.player.getLocationCoords() +
        session.world.printWorldMap(x, y);

    bot.sendMessage(msg.chat.id, message, buttons);
});

// ================= CALLBACK QUERY ===================
// Обработка Inline-кнопок
bot.on('callback_query', (query) => {
    const action = query.data;
    const currentChatID = query.message.chat.id;
    const session = getSession(currentChatID);
    const world = session.world;
    const player = session.player;

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
            // ... другие действия
        }

        x = player.getX();
        y = player.getY();

        //bot.answerCallbackQuery(action);
        //console.log(action, textResponce);

        const buttons = generateInlineButtons(
            world.getAvailableDirections(x, y),
            world.getAvailableActions(x, y)
        );

        if (!moved) {
            message += 'Нельзя идти туда.\n\n';
            player.addExperienceForAction(1);
        } else {
            player.addExperienceForAction(1);
        }

        message +=
            world.GetLocationText(x, y) +
            player.getLocationCoords() +
            world.printWorldMap(x, y);

        bot.sendMessage(currentChatID, message, buttons);
    }

    // ============ USE ===============
    if (action === 'use') {
        message = '';

        x = player.getX();
        y = player.getY();

        const itemsToUse = world.getItemsAtLocation(x, y);
        console.log('объектов на локации было ' + itemsToUse.length);
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
        console.log('будем использовать ' + oneItemToUse.name);
        //message = 'Вы использовали ' + oneItemToUse.name;
        message = player.useItem(oneItemToUse);
        player.addExperienceForAction(1);
        const indexToRemove = world.items.findIndex(
            (item) => item === oneItemToUse
        );
        world.items.splice(indexToRemove, 1);
        message += player.getPlayerDescription();

        message +=
            '\n' +
            world.GetLocationText(x, y) +
            player.getLocationCoords() +
            world.printWorldMap(x, y);

        const buttons = generateInlineButtons(
            world.getAvailableDirections(x, y),
            world.getAvailableActions(x, y)
        );

        bot.sendMessage(currentChatID, message, buttons);
    }

    // ============ ATTACK ===============
    if (action === 'attack') {
        session.combatState = true;
        message = '';
        x = player.getX();
        y = player.getY();
        if (Math.random() > 0.5) {
            message +=
                PlayerAttackNPC(world, player) +
                AllAgressiveNPCAttackPlayer(world, player);
        } else {
            message +=
                AllAgressiveNPCAttackPlayer(world, player) +
                PlayerAttackNPC(world, player);
        }

        message += '\n';
        let liveNPCs = world.getNPCsAtLocation(x, y);
        liveNPCs.forEach((npc) => {
            message += npc.getNpcDescription();
        });
        message += player.getPlayerDescription();

        if (liveNPCs.length == 0) {
            session.combatState = false;
            message +=
                '\n' +
                world.GetLocationText(x, y) +
                // player.getLocationCoords() +
                world.printWorldMap(x, y);
        }

        if (!session.combatState) {
            console.log('вышли из боя');
        }

        const buttons = generateInlineButtons(
            world.getAvailableDirections(x, y),
            world.getAvailableActions(x, y)
        );

        bot.sendMessage(currentChatID, message, buttons);
    }

    bot.answerCallbackQuery(query.id);
});
