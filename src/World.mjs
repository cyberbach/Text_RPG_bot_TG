import {
    LOCATION_TYPE,
    getRandomLocationDescription,
    locationIDToRussian,
} from './LocationTypes.mjs';
import { WORLD_NAMES } from './TextEnums/WorldNames.mjs';
import { AdjectiveWords } from './TextEnums/AdjectiveWords.mjs';
import { NPC, NPC_TYPE } from './NPC.mjs';
import { CharacterNames } from './TextEnums/CharacterNames.mjs';
import { MonsterNames } from './TextEnums/MonsterNames.mjs';
import { Item } from './Item.mjs';
import { Portal } from './Portal.mjs';
import { DEBUG_MERCHANT_QUEST_MASS_SPAWN, DEBUG_PORTAL_MASS_SPAWN, DEBUG_LOG_SPAWN, SPAWN_CHANCES, NPC_SETTINGS, PORTAL_SETTINGS } from './GameSetup.mjs';
import { STAT_EMOJI } from './TextEnums/SmileInText.mjs';
import { LOCATION_LETTER_TO_SYMBOL, MAP_SYMBOLS } from './TextEnums/MapSymbols.mjs';

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

    // Генерация случайного имени для NPC
    generateNpcName() {
        const adjectives = Object.values(AdjectiveWords);
        const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const names = Object.values(MonsterNames);
        const randomName = names[Math.floor(Math.random() * names.length)];
        return `${randomAdj} ${randomName}`;
    }

    // Рисование кривой линии (дорога или река)
    // startX, startY - начало, endX, endY - конец
    // maxDeviation - максимальное случайное отклонение вбок
    drawCurveLine(startX, startY, endX, endY, locationType, maxDeviation = 1) {
        let x = startX;
        let y = startY;
        const steps = Math.max(Math.abs(endX - startX), Math.abs(endY - startY)) * 2;

        for (let i = 0; i <= steps; i++) {
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                this.maze[y][x] = locationType;
            }

            if (x < endX) x++;
            else if (x > endX) x--;

            if (y < endY) y++;
            else if (y > endY) y--;

            // Случайное отклонение
            if (maxDeviation > 0 && Math.random() < 0.3) {
                const deviation = Math.floor(Math.random() * (maxDeviation * 2 + 1)) - maxDeviation;
                const isHorizontal = Math.random() < 0.5;
                
                if (isHorizontal) {
                    const newX = x + deviation;
                    if (newX >= 0 && newX < this.width && y >= 0 && y < this.height) {
                        this.maze[y][newX] = locationType;
                    }
                } else {
                    const newY = y + deviation;
                    if (x >= 0 && x < this.width && newY >= 0 && newY < this.height) {
                        this.maze[newY][x] = locationType;
                    }
                }
            }
        }
    }

    // Рисование пятна (озеро, лес, город)
    // centerX, centerY - центр, size - размер (количество клеток)
    // allowedTypes - типы которые можно перезаписывать (null = все)
    drawBlob(centerX, centerY, locationType, size, allowedTypes = null) {
        if (centerX < 0 || centerX >= this.width || centerY < 0 || centerY >= this.height) return;

        const visited = new Set();
        const queue = [[centerX, centerY]];
        visited.add(`${centerX},${centerX}`);

        // Можно ли перезаписать начальную клетку
        const initialCell = this.maze[centerY][centerX];
        if (allowedTypes === null || allowedTypes.includes(initialCell)) {
            this.maze[centerY][centerX] = locationType;
        }

        while (queue.length > 0 && visited.size < size) {
            const [cx, cy] = queue.shift();
            
            const neighbors = [
                [cx - 1, cy],
                [cx + 1, cy],
                [cx, cy - 1],
                [cx, cy + 1],
            ];

            for (const [nx, ny] of neighbors) {
                if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;
                
                const key = `${nx},${ny}`;
                if (visited.has(key)) continue;

                const currentCell = this.maze[ny][nx];
                
                // Проверяем можно ли перезаписать
                if (allowedTypes !== null && !allowedTypes.includes(currentCell)) continue;

                // С вероятностью добавляем соседа
                if (visited.size < size * 0.7 || Math.random() < 0.5) {
                    visited.add(key);
                    this.maze[ny][nx] = locationType;
                    queue.push([nx, ny]);
                }
            }
        }
    }

    // Очистка дорог от квадратных пересечений
    // Если 4 соседние клетки образуют квадрат, заменяем одну случайную на ландшафт
    cleanRoadIntersections() {
        const landscapeTypes = [
            LOCATION_TYPE.GLADE,
            LOCATION_TYPE.EMPTY,
            LOCATION_TYPE.FOREST,
            LOCATION_TYPE.THICKETS,
            LOCATION_TYPE.MEADOW,
        ];

        for (let y = 0; y < this.height - 1; y++) {
            for (let x = 0; x < this.width - 1; x++) {
                // Проверяем все 4 клетки квадрата
                const isRoadSquare = 
                    this.maze[y][x] === LOCATION_TYPE.ZROAD &&
                    this.maze[y][x + 1] === LOCATION_TYPE.ZROAD &&
                    this.maze[y + 1][x] === LOCATION_TYPE.ZROAD &&
                    this.maze[y + 1][x + 1] === LOCATION_TYPE.ZROAD;

                if (isRoadSquare) {
                    // Выбираем случайную клетку из 4
                    const randomIndex = Math.floor(Math.random() * 4);
                    const [rx, ry] = [
                        [x, y],
                        [x + 1, y],
                        [x, y + 1],
                        [x + 1, y + 1],
                    ][randomIndex];

                    // Заменяем на случайный ландшафт
                    const newType = landscapeTypes[Math.floor(Math.random() * landscapeTypes.length)];
                    this.maze[ry][rx] = newType;
                }
            }
        }
    }

    // Генерация мира (имя + лабиринт с типами локаций)
    generate() {
        const worldNames = Object.values(WORLD_NAMES);
        this.worldName = worldNames[Math.floor(Math.random() * worldNames.length)];

        // Шаг 1: Заполняем всё случайным ландшафтом
        const baseTerrain = [
            LOCATION_TYPE.GLADE,
            LOCATION_TYPE.EMPTY,
            LOCATION_TYPE.FOREST,
            LOCATION_TYPE.THICKETS,
            LOCATION_TYPE.MEADOW,
            LOCATION_TYPE.DESERT,
            LOCATION_TYPE.UNDERCAVE,
        ];
        for (let i = 0; i < this.height; i++) {
            this.maze[i] = [];
            for (let j = 0; j < this.width; j++) {
                this.maze[i][j] = baseTerrain[Math.floor(Math.random() * baseTerrain.length)];
            }
        }

        // Шаг 2: Рисуем реки (2-3 реки)
        const riverCount = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < riverCount; i++) {
            const startX = Math.floor(Math.random() * this.width);
            const startY = Math.random() < 0.5 ? 0 : this.height - 1;
            const endX = Math.floor(Math.random() * this.width);
            const endY = startY === 0 ? this.height - 1 : 0;
            this.drawCurveLine(startX, startY, endX, endY, LOCATION_TYPE.RIVER, 0);
        }

        // Шаг 3: Рисуем озёра (2-4 озера)
        const lakeCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < lakeCount; i++) {
            const cx = Math.floor(Math.random() * this.width);
            const cy = Math.floor(Math.random() * this.height);
            const size = 5 + Math.floor(Math.random() * 16); // 5-20 клеток
            this.drawBlob(cx, cy, LOCATION_TYPE.LAKE, size);
        }

        // Шаг 4: Рисуем дороги (3-5 дорог)
        const roadCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < roadCount; i++) {
            const startX = Math.random() < 0.5 ? 0 : this.width - 1;
            const startY = Math.floor(Math.random() * this.height);
            const endX = startX === 0 ? this.width - 1 : 0;
            const endY = Math.floor(Math.random() * this.height);
            this.drawCurveLine(startX, startY, endX, endY, LOCATION_TYPE.ZROAD, 1);
        }

        // Шаг 4.5: Очистка дорог от квадратных пересечений
        this.cleanRoadIntersections();

        // Шаг 5: Рисуем города у дорог (1-3 города)
        const cityCount = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < cityCount; i++) {
            // Ищем случайную клетку дороги
            const roadCells = [];
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (this.maze[y][x] === LOCATION_TYPE.ZROAD) {
                        roadCells.push([x, y]);
                    }
                }
            }
            if (roadCells.length > 0) {
                const [cx, cy] = roadCells[Math.floor(Math.random() * roadCells.length)];
                const size = 3 + Math.floor(Math.random() * 5); // 3-7 клеток
                this.drawBlob(cx, cy, LOCATION_TYPE.CITY, size);
            }
        }

        // Шаг 6: Рисуем лес (только на базовом ландшафте)
        const forestAllowedTypes = [
            LOCATION_TYPE.GLADE,
            LOCATION_TYPE.EMPTY,
            LOCATION_TYPE.THICKETS,
            LOCATION_TYPE.MEADOW,
            LOCATION_TYPE.DESERT,
            LOCATION_TYPE.UNDERCAVE,
        ];
        const forestCount = 3 + Math.floor(Math.random() * 4);
        for (let i = 0; i < forestCount; i++) {
            const cx = Math.floor(Math.random() * this.width);
            const cy = Math.floor(Math.random() * this.height);
            const size = 8 + Math.floor(Math.random() * 13); // 8-20 клеток
            this.drawBlob(cx, cy, LOCATION_TYPE.FOREST, size, forestAllowedTypes);
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

    // Генерация босса рядом с порталом
    generateBoss(excludeX, excludeY) {
        if (this.portals.length === 0) return;

        const { BOSS_HEALTH_MULTIPLIER, BOSS_ATTACK_MULTIPLIER, BOSS_SPAWN_RADIUS } = NPC_SETTINGS;

        // Выбираем случайный портал
        const portal = this.portals[Math.floor(Math.random() * this.portals.length)];

        // Ищем свободную клетку рядом с порталом
        const possiblePositions = [];
        for (let dx = -BOSS_SPAWN_RADIUS; dx <= BOSS_SPAWN_RADIUS; dx++) {
            for (let dy = -BOSS_SPAWN_RADIUS; dy <= BOSS_SPAWN_RADIUS; dy++) {
                const nx = portal.x + dx;
                const ny = portal.y + dy;
                
                if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) continue;
                if (nx === excludeX && ny === excludeY) continue;
                if (this.hasAggressiveNPC(nx, ny)) continue;
                
                const dist = Math.abs(dx) + Math.abs(dy);
                if (dist > 0 && dist <= BOSS_SPAWN_RADIUS) {
                    possiblePositions.push([nx, ny]);
                }
            }
        }

        if (possiblePositions.length === 0) return;

        const [bossX, bossY] = possiblePositions[Math.floor(Math.random() * possiblePositions.length)];

        const boss = new NPC();
        boss.npcType = NPC_TYPE.BOSS;
        boss.agressive = true;
        boss.x = bossX;
        boss.y = bossY;
        boss.name = this.generateNpcName();
        
        // Применяем множители
        boss.maxHealth *= BOSS_HEALTH_MULTIPLIER;
        boss.health = boss.maxHealth;
        boss.minAttackPower *= BOSS_ATTACK_MULTIPLIER;
        boss.maxAttackPower *= BOSS_ATTACK_MULTIPLIER;

        this.npcs.push(boss);
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
    printWorldMap(a, b, player = null) {
        let resultString = '```' + this.worldName + '\n -';

        for (let j = 0; j < this.width; j++) {
            resultString += '--';
        }
        resultString += '\n';

        // Вывод символов локаций
        for (let i = 0; i < this.height; i++) {
            let rowSymbols = [];
            resultString += '| ';
            for (let j = 0; j < this.width; j++) {
                const isVisible = player ? player.isCellVisible(j, i) : true;
                
                if (!isVisible) {
                    rowSymbols.push(MAP_SYMBOLS.FOG);
                    continue;
                }
                
                const locationType = this.maze[i][j];
                const firstLetter = locationType.charAt(0);
                let displaySymbol = LOCATION_LETTER_TO_SYMBOL[firstLetter] || ' ';

                if (a === j && b === i) {
                    displaySymbol = MAP_SYMBOLS.PLAYER;
                } else if (this.getPortalAtLocation(j, i)?.visited) {
                    displaySymbol = MAP_SYMBOLS.PORTAL;
                }

                rowSymbols.push(displaySymbol);
            }
            resultString += rowSymbols.join(' ');
            resultString += ' |\n';
        }

        resultString += ' -';
        for (let j = 0; j < this.width; j++) {
            resultString += '--';
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
            if (npc.isAggressiveMonster() && npc.x === a && npc.y === b) {
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
            const hasHostileNPCs = npcs.some(npc => npc.isAggressiveMonster());
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
