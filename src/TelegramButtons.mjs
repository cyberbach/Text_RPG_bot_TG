import { TG_MOVE_DIRECTIONS, TG_ACTIONS } from './TelegramAPIConstants.mjs';

/**
 * Генерирует inline-кнопки для игры
 * @param {string[]} availableDirections - доступные направления движения
 * @param {string[]} availableActions - доступные действия (attack, use, buy, help, portal)
 * @returns {object} объект с parse_mode и reply_markup для Telegram
 */
export function generateInlineButtons(availableDirections, availableActions) {
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

    return {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [generatedMoveButtons, generatedActionButtons],
        },
    };
}

/**
 * Генерирует кнопку "Новая игра" после смерти игрока
 * @returns {object} объект с parse_mode и reply_markup для Telegram
 */
export function generateDeathButtons() {
    return {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[{ text: 'Новая игра', callback_data: 'new_game' }]],
        },
    };
}
