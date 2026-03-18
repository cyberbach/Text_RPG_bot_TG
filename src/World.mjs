import {
    LOCATION_TYPE,
    getRandomLocationDescription,
    locationIDToRussian,
} from './LocationTypes.mjs';
import { WORLD_NAMES } from './TextEnums/WorldNames.mjs';
import { AdjectiveWords } from './TextEnums/AdjectiveWords.mjs';
import { NPC, NPC_TYPE } from './NPC.mjs';
import { CharacterNames } from './TextEnums/CharacterNames.mjs';
import { Item } from './Item.mjs';
import { Portal } from './Portal.mjs';
import { DEBUG_MERCHANT_QUEST_MASS_SPAWN, DEBUG_PORTAL_MASS_SPAWN, DEBUG_LOG_SPAWN, SPAWN_CHANCES, NPC_SETTINGS, PORTAL_SETTINGS } from './GameSetup.mjs';
import { STAT_EMOJI } from './TextEnums/SmileInText.mjs';

export class WorldGenerator {
    constructor() {}

    // Инициализация параметров мира
    setup(width, height) {
        this.width = width;
        this.height = height;
        this.maze = [];
        this.npcs = [];
        this.items = [];
        this.portals = [];
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

    // Создание NPC-торговца
    generateMerchant(excludeX, excludeY) {
        const generateName = () => {
            const adjectives = Object.values(AdjectiveWords);
            const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
            const names = Object.values(CharacterNames);
            const randomName = names[Math.floor(Math.random() * names.length)];
            return `${randomAdj} ${randomName}`;
        };

        if (DEBUG_MERCHANT_QUEST_MASS_SPAWN) {
            console.log('[DEBUG] Spawning merchants on all cells...');
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (x === excludeX && y === excludeY) continue;
                    if (this.hasAggressiveNPC(x, y)) continue;

                    const merchant = new NPC();
                    merchant.npcType = NPC_TYPE.MERCHANT;
                    merchant.agressive = false;
                    merchant.x = x;
                    merchant.y = y;
                    merchant.merchantPrice = 10 + Math.floor(Math.random() * 20);
                    merchant.name = generateName();
                    this.npcs.push(merchant);
                }
            }
            console.log(`[DEBUG] Merchants spawned: ${this.npcs.filter(n => n.npcType === NPC_TYPE.MERCHANT).length}`);
        } else {
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (x === excludeX && y === excludeY) continue;
                    if (this.hasAggressiveNPC(x, y)) continue;

                    if (Math.random() < SPAWN_CHANCES.MERCHANT) {
                        const merchant = new NPC();
                        merchant.npcType = NPC_TYPE.MERCHANT;
                        merchant.agressive = false;
                        merchant.x = x;
                        merchant.y = y;
                        merchant.merchantPrice = 10 + Math.floor(Math.random() * 20);
                        merchant.name = generateName();
                        this.npcs.push(merchant);
                    }
                }
            }
        }
    }

    // Создание NPC-квестодателя
    generateQuestGiver(excludeX, excludeY) {
        const generateName = () => {
            const adjectives = Object.values(AdjectiveWords);
            const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
            const names = Object.values(CharacterNames);
            const randomName = names[Math.floor(Math.random() * names.length)];
            return `${randomAdj} ${randomName}`;
        };

        if (DEBUG_MERCHANT_QUEST_MASS_SPAWN) {
            console.log('[DEBUG] Spawning quest givers on all cells...');
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (x === excludeX && y === excludeY) continue;
                    if (this.hasAggressiveNPC(x, y)) continue;

                    const questGiver = new NPC();
                    questGiver.npcType = NPC_TYPE.QUEST_GIVER;
                    questGiver.agressive = false;
                    questGiver.x = x;
                    questGiver.y = y;
                    questGiver.name = generateName();
                    this.npcs.push(questGiver);
                }
            }
            console.log(`[DEBUG] Quest givers spawned: ${this.npcs.filter(n => n.npcType === NPC_TYPE.QUEST_GIVER).length}`);
        } else {
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (x === excludeX && y === excludeY) continue;
                    if (this.hasAggressiveNPC(x, y)) continue;

                    if (Math.random() < SPAWN_CHANCES.QUEST_GIVER) {
                        const questGiver = new NPC();
                        questGiver.npcType = NPC_TYPE.QUEST_GIVER;
                        questGiver.agressive = false;
                        questGiver.x = x;
                        questGiver.y = y;
                        questGiver.name = generateName();
                        this.npcs.push(questGiver);
                    }
                }
            }
        }
    }

    // Генерация порталов
    generatePortals(excludeX, excludeY) {
        const { WORLD_PORTAL_COUNT } = PORTAL_SETTINGS;
        
        for (let i = 0; i < WORLD_PORTAL_COUNT; i++) {
            const portal = new Portal();
            portal.setup(this.width, this.height, excludeX, excludeY, true);
            this.portals.push(portal);
        }

        if (DEBUG_PORTAL_MASS_SPAWN) {
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (x === excludeX && y === excludeY) continue;

                    const portal = new Portal();
                    portal.setup(this.width, this.height, excludeX, excludeY, false);
                    this.portals.push(portal);
                }
            }
        } else if (Math.random() < SPAWN_CHANCES.PORTAL) {
            const regularPortal = new Portal();
            regularPortal.setup(this.width, this.height, excludeX, excludeY, false);
            this.portals.push(regularPortal);
        }
    }

    // Проверка наличия агрессивного NPC на клетке
    hasAggressiveNPC(x, y) {
        return this.npcs.some(npc => npc.isAggressiveMonster() && npc.x === x && npc.y === y);
    }

    // Создание одного предмета в указанной позиции
    generateOneItem(x, y) {
        const newItem = new Item();
        newItem.setupAtLocation(x, y);
        this.items.push(newItem);
    }

    // Генерация всех предметов мира
    generateItems(excludeX, excludeY) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (x === excludeX && y === excludeY) continue;
                
                if (Math.random() < SPAWN_CHANCES.ITEM) {
                    const newItem = new Item();
                    newItem.setupAtLocation(x, y);
                    this.items.push(newItem);
                }
            }
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
                } else if (this.getPortalAtLocation(j, i)?.visited) {
                    displayLetter = '@';
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
            if (npc.isAggressive() && npc.x === a && npc.y === b) {
                aggresiveNpcs.push(npc);
            }
        });
        if (aggresiveNpcs.length > 0) {
            resultArray.push('attack');
        }

        // Проверка наличия торговца
        this.npcs.forEach((npc) => {
            if (npc.isMerchant() && npc.x === a && npc.y === b) {
                resultArray.push('buy');
            }
        });

        // Проверка наличия квестодателя
        this.npcs.forEach((npc) => {
            if (npc.isQuestGiver() && npc.x === a && npc.y === b) {
                resultArray.push('help');
            }
        });

        if (this.getItemsAtLocation(a, b).length > 0) {
            resultArray.push('use');
        }

        if (this.getPortalAtLocation(a, b)) {
            resultArray.push('portal');
        }

        return resultArray;
    }

    // Получение портала на локации
    getPortalAtLocation(a, b) {
        return this.portals.find(portal => portal.x === a && portal.y === b);
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

    // Пересчет характеристик NPC в зависимости от уровня игрока
    recalculateNPCsForLevel(playerLevel) {
        if (playerLevel <= 1) return;
        
        const { ATTACK_BONUS_PER_LEVEL, BASE_HEALTH } = NPC_SETTINGS;
        const levelBonus = playerLevel - 1;
        
        this.npcs.forEach(npc => {
            npc.minAttackPower += levelBonus * ATTACK_BONUS_PER_LEVEL.MIN;
            npc.maxAttackPower += levelBonus * ATTACK_BONUS_PER_LEVEL.MAX;
            npc.health += levelBonus * Math.floor(BASE_HEALTH.MAX / 10);
            npc.maxHealth += levelBonus * Math.floor(BASE_HEALTH.MAX / 10);
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

    // Формирование текстового описания порталов для отображения
    getPortalsText(x, y) {
        let resultString = '';
        const portal = this.getPortalAtLocation(x, y);

        if (portal) {
            resultString += STAT_EMOJI.PORTAL + ' ' + portal.getPortalDescription() + '\n';
        }

        return resultString;
    }

    // Формирование полного описания локации (название + описание + NPC + предметы)
    GetLocationText(x, y, player = null) {
        const locationName = this.getLocationByXY(x, y).toUpperCase();
        const locationDescription = this.getLocationDescriptionByXY(x, y);

        let messageLocation =
            '***' + locationIDToRussian(locationName) + '***\n\n';

        if (locationName !== 'EMPTY') {
            messageLocation += locationDescription + ' ';
        }

        if (player) {
            messageLocation += this.getPortalHints(x, y);
        }
        messageLocation += '\n';

        messageLocation += '\n' + this.getNPCsText(x, y);
        messageLocation += this.getPortalsText(x, y);
        messageLocation += this.getItemsText(x, y);

        if (player) {
            const npcs = this.getNPCsAtLocation(x, y);
            const hasHostileNPCs = npcs.some(npc => npc.isAggressive());
            if (hasHostileNPCs) {
                messageLocation += player.getPlayerDescription() + '\n';
            }
        }

        return messageLocation;
    }

    // Подсказки о близости порталов
    getPortalHints(x, y) {
        if (this.portals.length === 0) return '';

        let minDistance = Infinity;
        
        for (const portal of this.portals) {
            const distance = Math.abs(portal.x - x) + Math.abs(portal.y - y);
            if (distance < minDistance) {
                minDistance = distance;
            }
        }

        if (minDistance === 1) {
            return 'Слышен звук портала.';
        } else if (minDistance === 2) {
            return 'Вдалеке виден блеск.';
        } else if (minDistance === 3) {
            return 'Чувствуется магия, где-то вдалеке.';
        }

        return '';
    }
}
