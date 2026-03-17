import { AdjectiveWords } from './AdjectiveWords.mjs';
import { DEBUG_NPC_CREATION } from './GameDebug.mjs';

export class NPC {
    constructor() {
        this.maxHealth =
            1 +
            Math.floor(Math.random() * 34) +
            Math.floor(Math.random() * 34) +
            Math.floor(Math.random() * 33);
        this.maxArmor = 50;
        this.health = this.maxHealth;
        this.armor = 0;
        this.minAttackPower = 1;
        this.maxAttackPower = 10;
        this.agressive = false;
        this.name = '';
    }

    setup(worldWidth, worldHeight, excludeX, excludeY) {
        this.x = Math.floor(Math.random() * worldWidth);
        this.y = Math.floor(Math.random() * worldHeight);

        if (this.x === excludeX && this.y === excludeY) {
            this.x = Math.floor(Math.random() * worldWidth);
            this.y = Math.floor(Math.random() * worldHeight);
        }

        this.minAttackPower = 1 + Math.floor(Math.random() * 5);
        this.maxAttackPower =
            this.minAttackPower + Math.floor(Math.random() * 17);

        // случайное прилагательное
        const adjectives = Object.values(AdjectiveWords);
        const randomAdj =
            adjectives[Math.floor(Math.random() * adjectives.length)];

        // случайное название монстра
        const baseNames = Object.values(MonsterNames);
        const randomBaseName =
            baseNames[Math.floor(Math.random() * baseNames.length)];

        this.name = `${randomAdj} ${randomBaseName}`;
        this.agressive = Math.random() >= 0.5;

        if (DEBUG_NPC_CREATION) {
            console.log('Created NPC:', this.name, ' at ', this.x, '/', this.y);
        }
    }

    getNpcDescription() {
        const attackString =
            ' 🗡️ ' + this.minAttackPower + '..' + this.maxAttackPower;

        let descriptionString = '';
        descriptionString += '👤 ' + this.name + ' ';
        if (this.agressive) {
            descriptionString += '❤️ ' + this.health + attackString;
        } else {
            descriptionString += '💚 (мирный)';
        }
        descriptionString += '\n';
        //console.log('monster description: ' + descriptionString);

        return descriptionString;
    }

    modifyHealth(amount) {
        this.health += amount;
        this.agressive = true;

        return this.health > 0;
    }
}

const MonsterNames = Object.freeze({
    // Классические существа
    GOBLIN: 'гоблин',
    OGRE: 'огр',
    TROLL: 'тролль',
    ORC: 'орк',
    GHOUL: 'гуль',

    // Мифические существа
    GRIFFIN: 'грифон',
    BASILISK: 'василиск',
    CHIMERA: 'химера',
    HARPY: 'гарпия',
    KRAKEN: 'кракен',

    // Нежить
    LICH: 'лич',
    WRAITH: 'призрак',
    BANSHEE: 'банши',
    ZOMBIE: 'зомби',
    SKELETON: 'скелет',

    // Демонические существа
    SUCCUBUS: 'суккуб',
    IMP: 'бесёнок',
    HELLHOUND: 'адский пёс',
    PIT_FIEND: 'демон бездны',
    ABYSSAL: 'абиссаль',

    // Элементали
    EARTH_ELEMENTAL: 'земляной элементаль',
    FIRE_ELEMENTAL: 'огненный элементаль',
    WATER_ELEMENTAL: 'водяной элементаль',
    AIR_ELEMENTAL: 'воздушный элементаль',
    STORM_ELEMENTAL: 'грозовой элементаль',

    // Рептилии и драконы
    WYRM: 'черведракон',
    DRAKE: 'драконид',
    WYVERN: 'виверна',
    SALAMANDER: 'саламандра',
    COCKATRICE: 'кокатрис',

    // Лесные существа
    TREANT: 'древень',
    DRYAD: 'дриада',
    WISP: 'блуждающий огонёк',
    THORN_BEAST: 'терновый зверь',
    MOSS_TROLL: 'моховой тролль',

    // Подземные монстры
    CAVE_CRAWLER: 'пещерный ползун',
    DEEP_DWELLER: 'глубинный житель',
    ROCK_GOLEM: 'каменный голем',
    TROGLODYTE: 'троглодит',
    GIANT_BAT: 'гигантская летучая мышь',

    // Магические существа
    SHADOW_STALKER: 'теневик',
    CRYSTAL_GOLEM: 'хрустальный голем',
    ARCANE_ABERRATION: 'магическое уродство',
    MANA_VAMPIRE: 'мана-вампир',
    SPELL_WEAVER: 'ткач заклинаний',

    // Гибриды
    CENTAUR: 'кентавр',
    MINOTAUR: 'минотавр',
    MERFOLK: 'морской народец',
    SATYR: 'сатир',
    GORGON: 'горгона',

    // Инсектоиды
    GIANT_SPIDER: 'гигантский паук',
    SCORPIONID: 'скорпионоид',
    MANTIS_WARRIOR: 'богомол-воин',
    HIVE_QUEEN: 'матка улья',
    SWARM_LORD: 'повелитель роя',
});
