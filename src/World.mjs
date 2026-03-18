import {
    LOCATION_TYPE,
    getRandomLocationDescription,
    locationIDToRussian,
} from './LocationTypes.mjs';
import { WORLD_NAMES } from './WorldTypes.mjs';
import { NPC } from './NPC.mjs';
import { Item } from './Item.mjs';

export class WorldGenerator {
    constructor() {}

    // Инициализация параметров мира
    setup(width, height) {
        this.width = width;
        this.height = height;
        this.maze = [];
        this.npcs = [];
        this.items = [];
        this.worldName = '';
    }

    // Генерация мира (имя + лабиринт с типами локаций)
    generate() {
        const worldNames = Object.values(WORLD_NAMES);
        this.worldName = worldNames[Math.floor(Math.random() * worldNames.length)];

        const max_available_location_types =
            Object.values(LOCATION_TYPE).length;

        // Инициализация лабиринта случайными типами локаций
        for (let i = 0; i < this.height; i++) {
            const row = [];
            for (let j = 0; j < this.width; j++) {
                const locationType =
                    Object.values(LOCATION_TYPE)[
                        Math.floor(Math.random() * max_available_location_types)
                    ];
                row.push(locationType);
            }
            this.maze.push(row);
        }
    }

    // Генерация всех NPC мира
    generateNPC(excludeX, excludeY) {
        // Расстановка NPC
        const maxNPCCount = this.height * this.width * 1.3;
        for (let index = 0; index < maxNPCCount; index++) {
            const newNPC = new NPC();
            newNPC.setup(this.width, this.height, excludeX, excludeY);
            this.npcs.push(newNPC);
        }
    }

    // Создание одного предмета в указанной позиции
    generateOneItem(x, y) {
        const newItem = new Item();
        newItem.setupAtLocation(x, y);
        this.items.push(newItem);
    }

    // Генерация всех предметов мира
    generateItems(excludeX, excludeY) {
        // Расстановка Items
        const maxItemsCount = this.height * this.width * 1.1;
        for (let index = 0; index < maxItemsCount; index++) {
            const newItem = new Item();
            newItem.setup(this.width, this.height, excludeX, excludeY);
            this.items.push(newItem);
        }
    }

    // Вывод мира в консоль (для отладки)
    printWorldOnConsole() {
        // Вывод лабиринта в консоль
        for (const row of this.maze) {
            console.log(row.join(' '));
        }
    }

    // Формирование ASCII-карты мира для отображения в Telegram
    printWorldMap(a, b) {
        let resultString = '```' + this.worldName + '\n -';

        for (let j = 0; j < this.width; j++) {
            resultString += '=-';
        }
        resultString += '\n';

        // Вывод только первых букв типов локаций в консоль
        for (let i = 0; i < this.height; i++) {
            let firstLetterRow = [];
            resultString += '| ';
            for (let j = 0; j < this.width; j++) {
                const locationType = this.maze[i][j];
                // Извлекаем первую букву типа локации
                const firstLetter = locationType.charAt(0);
                let displayLetter = ' ';
                switch (firstLetter) {
                    case 'F': // FOREST
                        displayLetter = '△';
                        break;
                    case 'D': // DESERT
                        displayLetter = ' ';
                        break;
                    case 'U': // UNDERCAVE
                        displayLetter = '.';
                        break;
                    case 'R': // RIVER
                        displayLetter = '◌'; //◯
                        break;
                    case 'G': // GLADE
                        displayLetter = '.';
                        break;
                    case 'M': // MEADOW
                        displayLetter = '.';
                        break;
                    case 'T': // THICKETS
                        displayLetter = '+';
                        break;
                    case 'Z': // ZROAD
                        displayLetter = '.';
                        break;
                    case 'C': // CITY
                        displayLetter = '▯';
                        break;
                }

                if (a === j && b === i) {
                    displayLetter = '●'; // HERO ● ◆
                }

                firstLetterRow.push(displayLetter);
            }
            resultString += firstLetterRow.join(' ');
            resultString += ' |\n';
        }

        resultString += ' -';
        for (let j = 0; j < this.width; j++) {
            resultString += '=-';
        }
        resultString += '```\n';

        return resultString;
    }

    // Получение типа локации по координатам
    getLocationByXY(b, a) {
        // Проверка, что индексы a и b находятся в допустимом диапазоне
        if (a >= 0 && a < this.height && b >= 0 && b < this.width) {
            return this.maze[a][b];
        } else {
            console.error(
                `Invalid indices: a=${a}, b=${b}. Out of bounds for maze dimensions ${this.height}x${this.width}`
            );
            return undefined;
        }
    }

    // Получение описания локации по координатам
    getLocationDescriptionByXY(b, a) {
        // Проверка, что индексы a и b находятся в допустимом диапазоне
        if (a >= 0 && a < this.height && b >= 0 && b < this.width) {
            let location = this.maze[a][b];
            return getRandomLocationDescription(location);
        } else {
            console.error(
                `Invalid indices: a=${a}, b=${b}. Out of bounds for maze dimensions ${this.height}x${this.width}`
            );
            return undefined;
        }
    }

    // Получение доступных направлений движения
    getAvailableDirections(a, b) {
        let resultArray = [];
        if (a > 0) resultArray.push('move_left');
        if (b > 0) resultArray.push('move_up');
        if (b < this.height - 1) resultArray.push('move_down');
        if (a < this.width - 1) resultArray.push('move_right');

        return resultArray;
    }

    // Получение доступных действий (атака/подбор) на локации
    getAvailableActions(a, b) {
        let resultArray = [];

        const aggresiveNpcs = [];
        this.npcs.forEach((npc) => {
            if (npc.agressive && npc.x === a && npc.y === b) {
                aggresiveNpcs.push(npc);
            }
        });
        if (aggresiveNpcs.length > 0) {
            resultArray.push('attack');
        }

        if (this.getItemsAtLocation(a, b).length > 0) {
            resultArray.push('use');
        }

        return resultArray;
    }

    getNPCsAtLocation(a, b) {
        const foundNPCs = [];
        this.npcs.forEach((npc) => {
            if (npc.x === a && npc.y === b) {
                foundNPCs.push(npc);
            }
        });
        return foundNPCs;
    }

    // Получение всех NPC на локации
    getNPCsAtLocation(a, b) {
        const foundNPCs = [];
        this.npcs.forEach((npc) => {
            if (npc.x === a && npc.y === b) {
                foundNPCs.push(npc);
            }
        });
        return foundNPCs;
    }

    // Получение всех предметов на локации
    getItemsAtLocation(a, b) {
        const foundItems = [];
        this.items.forEach((item) => {
            if (item.x === a && item.y === b) {
                foundItems.push(item);
            }
        });
        return foundItems;
    }

    // Формирование текстового описания NPC для отображения
    getNPCsText(x, y) {
        let resultString = '';
        const npcObjectsToDisplay = this.getNPCsAtLocation(x, y);

        if (npcObjectsToDisplay.length > 0) {
            resultString += 'Обитатели на локации:\n'; //👥
            npcObjectsToDisplay.forEach((oneNpc) => {
                resultString += oneNpc.getNpcDescription();
            });
            resultString += '\n';
        }

        return resultString;
    }

    recalculateNPCsForLevel(playerLevel) {
        if (playerLevel <= 1) return;
        
        const levelBonus = playerLevel - 1;
        
        this.npcs.forEach(npc => {
            npc.minAttackPower += levelBonus;
            npc.maxAttackPower += levelBonus * 2;
            npc.health += levelBonus * 10;
            npc.maxHealth += levelBonus * 10;
        });
    }

    // Пересчет характеристик NPC в зависимости от уровня игрока
    recalculateNPCsForLevel(playerLevel) {
        if (playerLevel <= 1) return;
        
        const levelBonus = playerLevel - 1;
        
        this.npcs.forEach(npc => {
            npc.minAttackPower += levelBonus;
            npc.maxAttackPower += levelBonus * 2;
            npc.health += levelBonus * 10;
            npc.maxHealth += levelBonus * 10;
        });
    }

    // Формирование текстового описания предметов для отображения
    getItemsText(x, y) {
        let resultString = '';
        const itemsToDisplay = this.getItemsAtLocation(x, y);

        if (itemsToDisplay.length > 0) {
            resultString += 'Объекты на локации:\n'; //👥
            itemsToDisplay.forEach((oneItem) => {
                resultString += oneItem.getItemDescription();
            });
            resultString += '\n';
        }

        return resultString;
    }

    // Формирование полного описания локации (название + описание + NPC + предметы)
    GetLocationText(x, y) {
        const locationName = this.getLocationByXY(x, y).toUpperCase();
        //const locationNameString = locationName.toUpperCase();
        const locationDescription = this.getLocationDescriptionByXY(x, y);

        let messageLocation =
            '***' + locationIDToRussian(locationName) + '***\n\n';

        if (locationName !== 'EMPTY') {
            messageLocation += locationDescription + '\n\n';
        }
        messageLocation += this.getNPCsText(x, y);

        messageLocation += this.getItemsText(x, y);

        return messageLocation;
    }
}
