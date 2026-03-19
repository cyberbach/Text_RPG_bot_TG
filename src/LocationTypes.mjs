import { LOCATION_DESCRIPTIONS } from './TextEnums/LocationDescriptions.mjs';

export const LOCATION_TYPE = {
    EMPTY: 'EMPTY',
    FOREST: 'FOREST',
    DESERT: 'DESERT',
    UNDERCAVE: 'UNDERCAVE',
    RIVER: 'RIVER',
    LAKE: 'LAKE',
    GLADE: 'GLADE',
    MEADOW: 'MEADOW',
    THICKETS: 'THICKETS',
    ZROAD: 'ZROAD',
    CITY: 'CITY',
};

export { LOCATION_DESCRIPTIONS };

// Функция для получения случайного элемента из массива
function getRandomElement(array) {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

// Функция для получения случайной строки описания по типу локации
export function getRandomLocationDescription(locationType) {
    const testLocation = locationType.toUpperCase();
    const descriptions = LOCATION_DESCRIPTIONS[testLocation];
    //console.log(descriptions);
    if (descriptions) {
        return getRandomElement(descriptions);
    } else {
        throw new Error(
            `No descriptions found for location type: ${locationType}`
        );
    }
}

export function locationIDToRussian(id) {
    //let testID = id.toUpperCase();
    let russianNameFromID = '';

    switch (id) {
        case 'EMPTY':
            russianNameFromID = 'Пустоши';
            break;
        case 'FOREST':
            russianNameFromID = '🌳 Лес 🌿';
            break;
        case 'DESERT':
            russianNameFromID = '🌵 Пустыня 🏝️';
            break;
        case 'UNDERCAVE':
            russianNameFromID = '🏔️ Пещера ⛏️';
            break;
        case 'RIVER':
            russianNameFromID = '🌊 Река 🚣';
            break;
        case 'LAKE':
            russianNameFromID = '💧 Озеро 🐟';
            break;
        case 'GLADE':
            russianNameFromID = '☀️🌸 Поляна 🦋🍀';
            break;
        case 'MEADOW':
            russianNameFromID = '🌾🐝 Луг 🌼 🌤️';
            break;
        case 'THICKETS':
            russianNameFromID = '🌲 Заросли 🌳';
            break;
        case 'ZROAD':
            russianNameFromID = '🛣️ Дорога 🛤️';
            break;
        case 'CITY':
            russianNameFromID = '🏰 Поселение 🏘️';
            break;
    }

    return russianNameFromID;
}
