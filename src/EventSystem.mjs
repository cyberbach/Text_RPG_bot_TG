// Система игровых эвентов

import { STAT_EMOJI } from './SmileInText.mjs';

export const EVENT_TYPE = Object.freeze({
    WEATHER_SUNNY: 'weather_sunny',
    WEATHER_CLOUDY: 'weather_cloudy',
    WEATHER_RAINY: 'weather_rainy',
    WEATHER_FOGGY: 'weather_foggy',
    WEATHER_STORMY: 'weather_stormy',
});

export const EVENT_WEATHER_MODIFIERS = Object.freeze({
    [EVENT_TYPE.WEATHER_SUNNY]: 10,    // Солнечно: +10% к шансу попадания
    [EVENT_TYPE.WEATHER_CLOUDY]: 0,    // Облачно: без изменений
    [EVENT_TYPE.WEATHER_RAINY]: -10,   // Дождливо: -10% к шансу попадания
    [EVENT_TYPE.WEATHER_FOGGY]: -15,    // Туманно: -15% к шансу попадания
    [EVENT_TYPE.WEATHER_STORMY]: -5,    // Гроза: -5% к шансу попадания
});

export const EVENT_WEATHER_NAMES = Object.freeze({
    [EVENT_TYPE.WEATHER_SUNNY]: STAT_EMOJI.WEATHER_SUNNY + ' Солнечно',
    [EVENT_TYPE.WEATHER_CLOUDY]: STAT_EMOJI.WEATHER_CLOUDY + ' Облачно',
    [EVENT_TYPE.WEATHER_RAINY]: STAT_EMOJI.WEATHER_RAINY + ' Дождливо',
    [EVENT_TYPE.WEATHER_FOGGY]: STAT_EMOJI.WEATHER_FOGGY + ' Туманно',
    [EVENT_TYPE.WEATHER_STORMY]: STAT_EMOJI.WEATHER_STORMY + ' Гроза',
});

// Текущий активный эвент
let currentEvent = EVENT_TYPE.WEATHER_SUNNY;
let currentEventDuration = 0; // Количество ходов до смены эвента

// Установка случайного эвента
export function setRandomEvent() {
    const events = Object.values(EVENT_TYPE);
    currentEvent = events[Math.floor(Math.random() * events.length)];
    currentEventDuration = 3 + Math.floor(Math.random() * 5); // 3-7 ходов
    return currentEvent;
}

// Уменьшение длительности эвента, возврат true если эвент истек
export function tickEventDuration() {
    currentEventDuration--;
    if (currentEventDuration <= 0) {
        setRandomEvent();
        return true;
    }
    return false;
}

// Получение модификатора шанса попадания для текущего эвента
export function getHitChanceModifier() {
    return EVENT_WEATHER_MODIFIERS[currentEvent] || 0;
}

// Получение текущего эвента
export function getCurrentEvent() {
    return currentEvent;
}

// Получение названия текущего эвента
export function getCurrentEventName() {
    return EVENT_WEATHER_NAMES[currentEvent] || '';
}

// Инициализация эвента при старте игры
export function initEvent() {
    currentEvent = setRandomEvent();
}
