// Символы для отображения карты мира

export const MAP_SYMBOLS = Object.freeze({
    EMPTY: ' ',
    FOREST: '△',
    DESERT: ' ',
    UNDERCAVE: ' ',
    RIVER: '◌',
    LAKE: '◌',
    GLADE: ' ',
    MEADOW: ' ',
    THICKETS: ' ',
    ZROAD: '·',
    CITY: '⌂',
    PLAYER: '●',
    PORTAL: '@',
    BOSS: '👹',
    FOG: ' ',
});

// Соответствие первой буквы типа локации символу
export const LOCATION_LETTER_TO_SYMBOL = Object.freeze({
    'E': MAP_SYMBOLS.EMPTY,
    'F': MAP_SYMBOLS.FOREST,
    'D': MAP_SYMBOLS.DESERT,
    'U': MAP_SYMBOLS.UNDERCAVE,
    'R': MAP_SYMBOLS.RIVER,
    'L': MAP_SYMBOLS.LAKE,
    'G': MAP_SYMBOLS.GLADE,
    'M': MAP_SYMBOLS.MEADOW,
    'T': MAP_SYMBOLS.THICKETS,
    'Z': MAP_SYMBOLS.ZROAD,
    'C': MAP_SYMBOLS.CITY,
});
