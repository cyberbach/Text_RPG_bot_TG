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

// ================= GAME CODE ===================

const WORLD_MOBILE_WIDTH = 4; // 13 максимум на телефоне
const WORLD_MOBILE_HEIGHT = 4; // 10
const WORLD_PC_WIDTH = 22;
const WORLD_PC_HEIGHT = 16;
let combatState = false;

const world = new WorldGenerator();
const player = new Player();

const bot = new TelegramBot(process.env.BOT_TOKEN, {
    polling: {
        interval: 300, // Опционально: интервал опроса в мс
        autoStart: true,
    },
});

bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

const mainMenu = [
    { command: 'start', description: 'Начать игру на мобильном' },
    { command: 'pc', description: 'Начать игру на компьютере' },
    { command: 'help', description: 'Помощь' },
];
await bot.setMyCommands(mainMenu);

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
    world.setup(WORLD_MOBILE_WIDTH, WORLD_MOBILE_HEIGHT);
    world.generate();
    player.setup(WORLD_MOBILE_WIDTH, WORLD_MOBILE_HEIGHT, msg.from.first_name);
    player.clearAttributes();
    player.setRandomLocation();
    const x = player.getX();
    const y = player.getY();
    world.generateNPC(x, y);
    world.generateItems(x, y);

    const buttons = generateInlineButtons(
        world.getAvailableDirections(x, y),
        world.getAvailableActions(x, y)
    );

    const message =
        `⚔️ Добро пожаловать в *Текстовое Приключение!* ⚔️\n\n` +
        msg.from.first_name +
        `, вы - отважный искатель приключений в мрачном мире. Ваша цель - исследовать руины, ` +
        `сражаться с монстрами и находить сокровища.\n\n` +
        world.GetLocationText(x, y) +
        player.getLocationCoords() +
        world.printWorldMap(x, y);

    bot.sendMessage(msg.chat.id, message, buttons, {
        parse_mode: 'MarkdownV2',
    });
});

// ================= START on PC ===================
// start
bot.onText(/\/pc/, (msg) => {
    world.setup(WORLD_PC_WIDTH, WORLD_PC_HEIGHT);
    world.generate();
    player.setup(WORLD_PC_WIDTH, WORLD_PC_HEIGHT, msg.from.first_name);
    player.clearAttributes();
    player.setRandomLocation();
    const x = player.getX();
    const y = player.getY();
    world.generateNPC(x, y);
    world.generateItems(x, y);

    const buttons = generateInlineButtons(
        world.getAvailableDirections(x, y),
        world.getAvailableActions(x, y)
    );

    const message =
        `⚔️ Добро пожаловать в *Текстовое Приключение!* ⚔️\n\n` +
        msg.from.first_name +
        `, вы - отважный искатель приключений в мрачном мире. Ваша цель - исследовать руины, ` +
        `сражаться с монстрами и находить сокровища.\n\n` +
        world.GetLocationText(x, y) +
        player.getLocationCoords() +
        world.printWorldMap(x, y);

    bot.sendMessage(msg.chat.id, message, buttons, {
        parse_mode: 'MarkdownV2',
    });
});

// ================= HELP ===================
// help
bot.onText(/\/help/, (msg) => {
    //const player = getPlayer(msg.chat.id);
    //const message = `⚔️ Хелп игры\n\n`;

    world.generate();
    player.setRandomLocation();

    const x = player.getX();
    const y = player.getY();
    world.generateNPC(x, y);

    const buttons = generateInlineButtons(
        world.getAvailableDirections(x, y),
        world.getAvailableActions(x, y)
    );

    console.log(world.printWorldMap(x, y));

    const message =
        `⚔️ *Добро пожаловать в Текстовое Подземелье!*\n\n` +
        msg.from.first_name +
        `, вы - отважный искатель приключений в мрачном мире. Ваша цель - исследовать руины, ` +
        `сражаться с монстрами и находить сокровища.\n\n` +
        world.GetLocationText(x, y) +
        player.getLocationCoords() +
        world.printWorldMap(x, y);

    bot.sendMessage(msg.chat.id, message, buttons, {
        parse_mode: 'MarkdownV2',
    });
});

// ================= CALLBACK QUERY ===================
// Обработка Inline-кнопок
bot.on('callback_query', (query) => {
    const action = query.data;
    const currentChatID = query.message.chat.id;

    let message = '';

    const x = player.getX();
    const y = player.getY();

    // ================== MOVE ======================
    if (
        action === 'move_up' ||
        action === 'move_down' ||
        action === 'move_left' ||
        action === 'move_right'
    ) {
        switch (action) {
            case 'move_up':
                player.move(DIRECTIONS.UP);
                break;
            case 'move_down':
                player.move(DIRECTIONS.DOWN);
                break;
            case 'move_left':
                player.move(DIRECTIONS.LEFT);
                break;
            case 'move_right':
                player.move(DIRECTIONS.RIGHT);
                break;
            // ... другие действия
        }

        //bot.answerCallbackQuery(action);
        //console.log(action, textResponce);

        const buttons = generateInlineButtons(
            world.getAvailableDirections(x, y),
            world.getAvailableActions(x, y)
        );

        message +=
            world.GetLocationText(x, y) +
            player.getLocationCoords() +
            world.printWorldMap(x, y);

        bot.sendMessage(currentChatID, message, buttons);
    }

    // ============ USE ===============
    if (action === 'use') {
        message = '';

        const itemsToUse = world.getItemsAtLocation(x, y);
        console.log('объектов на локации было ' + itemsToUse.length);
        const oneItemToUse =
            itemsToUse[Math.floor(Math.random() * itemsToUse.length)];
        console.log('будем использовать ' + oneItemToUse.name);
        //message = 'Вы использовали ' + oneItemToUse.name;
        message = player.useItem(oneItemToUse);
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
        combatState = true;
        message = '';
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
            combatState = false;
            message +=
                '\n' +
                world.GetLocationText(x, y) +
                // player.getLocationCoords() +
                world.printWorldMap(x, y);
        }

        if (!combatState) {
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
