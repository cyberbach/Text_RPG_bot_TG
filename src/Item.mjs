import { AdjectiveWords } from './AdjectiveWords.mjs';
import { DEBUG_ITEMS_CREATION } from './GameDebug.mjs';

export class Item {
    constructor() {
        this.health = 0;
        this.maxHealth = 0;
        this.minAttackPower = 0;
        this.maxAttackPower = 0;
        this.isHealing = false;
        this.isWeapon = false;
        this.name = '';
    }

    setup(worldWidth, worldHeight, excludeX, excludeY) {
        this.x = Math.floor(Math.random() * worldWidth);
        this.y = Math.floor(Math.random() * worldHeight);

        if (this.x === excludeX && this.y === excludeY) {
            this.x = Math.floor(Math.random() * worldWidth);
            this.y = Math.floor(Math.random() * worldHeight);
        }

        if (Math.random() > 0.5) {
            this.isHealing = false;
            this.isWeapon = true;
            const baseNames = Object.values(WeaponNames);
            this.name = baseNames[Math.floor(Math.random() * baseNames.length)];
            if (Math.random() > 0.5) {
                this.minAttackPower = 1 + Math.floor(Math.random() * 10);
            } else {
                this.maxAttackPower = 1 + Math.floor(Math.random() * 20);
            }
        } else {
            this.isHealing = true;
            this.isWeapon = false;
            const baseNames = Object.values(HealItemNames);
            this.name = baseNames[Math.floor(Math.random() * baseNames.length)];
            if (Math.random() > 0.3) {
                this.health = 1 + Math.floor(Math.random() * 50);
            } else {
                this.maxHealth = Math.floor(Math.random() * 50);
            }
        }

        if (DEBUG_ITEMS_CREATION) {
            console.log(
                'Created Item:',
                this.name,
                ' at ',
                this.x,
                '/',
                this.y
            );
        }
    }

    setupAtLocation(a, b) {
        this.x = a;
        this.y = b;
        if (Math.random() > 0.5) {
            this.isHealing = false;
            this.isWeapon = true;
            const baseNames = Object.values(WeaponNames);
            this.name = baseNames[Math.floor(Math.random() * baseNames.length)];
            this.attackPower = 1 + Math.floor(Math.random() * 10);
        } else {
            this.isHealing = true;
            this.isWeapon = false;
            const baseNames = Object.values(HealItemNames);
            this.name = baseNames[Math.floor(Math.random() * baseNames.length)];
            this.health = 1 + Math.floor(Math.random() * 20);
            this.maxHealth = Math.floor(Math.random() * 30);
        }

        console.log('Created Item:', this.name, ' at ', this.x, '/', this.y);
    }

    getItemDescription() {
        let descriptionString = '';
        descriptionString += '- ' + this.name + ' ';
        descriptionString += this.isHealing
            ? '❤️ ' + (this.health + this.maxHealth)
            : '⚔️ ' + (this.minAttackPower + this.maxAttackPower); // ⚔️
        descriptionString += '\n';
        //console.log('monster description: ' + descriptionString);
        return descriptionString;
    }
}

const WeaponNames = Object.freeze({
    // Легендарные мечи
    EXCALIBUR: 'Эскалибур',
    DRAGON_SLAYER: 'Убийца драконов',
    FROSTBANE: 'Морозная погибель',
    SOLAR_EDGE: 'Солнечная грань',
    VOID_REAPER: 'Жнец Бездны',

    // Топоры и секиры
    SKULL_SPLITTER: 'Раскалыватель черепов',
    THUNDER_MAUL: 'Громовой молот',
    DWARVEN_RAMPAGE: 'Ярость гномов',
    MOUNTAIN_CLEAVER: 'Рассекатель гор',
    BERSERKER_FURY: 'Ярость берсерка',

    // Луки и арбалеты
    WINDRUNNER: 'Повелитель ветра',
    PHANTOM_ARCHER: 'Призрачный лучник',
    STARSEEKER: 'Искатель звезд',
    VIPER_STING: 'Жало гадюки',
    SOLAR_FLARE: 'Солнечная вспышка',

    // Магические посохи
    ARCANE_FOCUS: 'Фокус Арканы',
    INFINITY_ROD: 'Жезл Бесконечности',
    ABYSSAL_WHISPER: 'Шепот Бездны',
    ELEMENTAL_CONDUIT: 'Проводник Стихий',
    MOONWEAVER: 'Ткач Лунного Света',

    // Кинжалы и когти
    SHADOW_FANG: 'Теневой Клык',
    VENOMTOOTH: 'Ядовитый Зуб',
    ASSASSINS_SILENCE: 'Тишина Убийцы',
    PHANTOM_CLAW: 'Призрачный Коготь',
    SOUL_SHANKER: 'Пронзатель Душ',

    // Экзотическое оружие
    VOID_TALON: 'Коготь Пустоты',
    CHRONOMANCER_BLADE: 'Клинок Хрономанта',
    DREAMCATCHER_SCYTHE: 'Коса Ловца Снов',
    CELESTIAL_ORB: 'Небесная Сфера',
    PSIONIC_GAUNTLET: 'Псионическая Перчатка',

    // Оружие стихий
    INFERNO_BLADE: 'Клинок Инферно',
    TIDAL_TRIDENT: 'Трезубец Приливов',
    TEMPEST_AXE: 'Топор Бури',
    TERRA_MACE: 'Булава Земли',
    AETHER_WAND: 'Жезл Эфира',

    // Древние реликвии
    PHARAOH_SCEPTER: 'Скипетр Фараона',
    RUNIC_MONOLITH: 'Рунический Монолит',
    OLYMPIAN_SPEAR: 'Копье Олимпа',
    VALHALLAS_CHOSEN: 'Избранный Вальхаллы',
    ATLANTEAN_GLAIVE: 'Глефа Атлантиды',

    // Орковое оружие
    BLOODSKULL_MAUL: 'Молот Кровавого Черепа',
    IRONHIDE_CLEAVER: 'Секира Железной Кожи',
    WARLORD_DESPOILER: 'Разоритель Вождей',
    GRONN_TUSK: 'Клык Гронна',
    FEL_IRON_REAPER: 'Жнец Скверножелеза',

    // Эльфийское оружие
    SILVERWOOD_BOW: 'Лук Серебряного Леса',
    LUNAR_WHISPER: 'Лунный Шепот',
    ANCIENT_GUARDIAN: 'Древний Страж',
    STARFALL_ARROW: 'Стрела Звездопада',
    DRYADS_EMBRACE: 'Объятия Дриады',

    // Оружие нежити
    BONE_CARVER: 'Резчик Костей',
    SOULDRINKER: 'Пьющая Души',
    GRAVEDIGGER: 'Могильный Копатель',
    NECROTIC_SCYTHE: 'Некротическая Коса',
    WITHERED_BRANCH: 'Увядшая Ветвь',

    // Драконье оружие
    WYRMBONE_GREATSWORD: 'Двуручник из Кости Дракона',
    SCALEBANE_SPEAR: 'Копье Чешуеборца',
    EMBERCLAW: 'Огненный Коготь',
    FROSTWYRM_FANG: 'Клык Ледяного Змея',
    DRACONIC_VOLLEY: 'Драконий Залп',

    // Божественное оружие
    SERAPHIM_BLADE: 'Клинок Серафима',
    DIVINE_RETRIBUTION: 'Божественная Расплата',
    HOLY_AVENGER: 'Святой Мститель',
    PURITY_STAFF: 'Посох Чистоты',
    ARCHANGELS_WRATH: 'Гнев Архангела',

    // Хаотичное оружие
    DEMONFORGE_HAMMER: 'Молот Демонской Кузни',
    CHAOS_BLADE: 'Клинок Хаоса',
    ABYSSAL_SHARD: 'Осколок Бездны',
    INFERNAL_WHIP: 'Адский Кнут',
    VOIDCALLER: 'Призыватель Бездны',

    // Техномагическое
    COGSAW: 'Зубчатый Резак',
    STEAM_PISTON_MACE: 'Паровой Молот',
    ARCANE_CORE_RIFLE: 'Винтовка с Магическим Ядром',
    CRYSTAL_RESONATOR: 'Кристальный Резонатор',
    GEARBLADE: 'Шестеренчатый Клинок',

    // Природное оружие
    THORNED_VINE: 'Шипастая Лоза',
    PETRIFIED_ROOT: 'Окаменевший Корень',
    WHISPERING_OAK: 'Шепчущий Дуб',
    STONEBARK_CUDGEL: 'Дубина Каменной Коры',
    WILDFIRE_STAFF: 'Посох Дикого Огня',

    // Критические названия
    HEARTSEEKER: 'Искатель Сердец',
    MINDREAVER: 'Разрушитель Разума',
    NIGHTMARE_BRINGER: 'Приносящий Кошмары',
    SOULBINDER: 'Повелитель Душ',
    DOOMBRINGER: 'Вестник Рока',

    // Ироничные названия
    GOBLIN_POKER: 'Гоблинье Тыкало',
    TROLL_DENTIST: 'Зубодер Троллей',
    MINNOW_SLAPPER: 'Шлепатель Пескарей',
    WIZARDS_MISTAKE: 'Ошибка Волшебника',
    ORC_TOOTHPICK: 'Зубочистка Орка',

    // Поэтичные названия
    DAWNS_FIRST_LIGHT: 'Первый Свет Зари',
    EVENING_STAR: 'Вечерняя Звезда',
    OCEANS_DEPTH: 'Глубина Океана',
    MOUNTAINS_SOUL: 'Душа Горы',
    FORESTS_BREATH: 'Дыхание Леса',

    // Мистические артефакты
    RUNEBOUND_RELIC: 'Руническая Реликвия',
    VEILWALKER: 'Ходящий по Завесе',
    ECHOES_OF_MADNESS: 'Эхо Безумия',
    PRIMORDIAL_SHARD: 'Первозданный Осколок',
    INFINITE_PARADOX: 'Бесконечный Парадокс',
});

const HealItemNames = Object.freeze({
    // Базовые зелья
    MINOR_HEALING_POTION: 'Слабое зелье лечения',
    HEALING_POTION: 'Зелье лечения',
    GREATER_HEALING_POTION: 'Сильное зелье лечения',
    MAJOR_HEALING_POTION: 'Великое зелье лечения',

    // Природные средства
    HEALING_HERBS: 'Целебные травы',
    EMBERROOT: 'Огненный корень',
    MOONPETAL_SALVE: 'Мазь из лунных лепестков',
    SUN_BERRIES: 'Солнечные ягоды',
    FOREST_BALM: 'Лесной бальзам',

    // Священные исцеления
    HOLY_WATER: 'Святая вода',
    ANGEL_TEARS: 'Слезы ангела',
    BLESSED_BANDAGE: 'Благословенная повязка',
    DIVINE_AMBROSIA: 'Божественная амброзия',
    PURIFYING_CRYSTAL: 'Очищающий кристалл',

    // Магические эссенции
    PHOENIX_ESSENCE: 'Эссенция феникса',
    LIFE_ESSENCE: 'Эссенция жизни',
    ARCANE_SALVE: 'Чародейская мазь',
    MANA_INFUSED_BREW: 'Настой маны',
    RESURRECTION_ELIXIR: 'Эликсир воскрешения',

    // Необычные предметы
    VAMPIRE_VENOM_ANTIDOTE: 'Антидот вампирского яда',
    REGENERATIVE_MOSS: 'Регенеративный мох',
    DWARVEN_STONEBREW: 'Гномий каменный напиток',
    ELIXIR_OF_VITALITY: 'Эликсир жизненной силы',
    FAERIE_DUST: 'Пыльца фей',

    // Еда и напитки
    HEARTY_STEW: 'Сытное рагу',
    GOLDEN_APPLE: 'Золотое яблоко',
    MIGHTY_MEAD: 'Могучий медовух',
    DRAGON_BLOOD_WINE: 'Вино из драконьей крови',
    AMBROSIAL_NECTAR: 'Нектар амброзии',

    // Экстренные средства
    EMERGENCY_BANDAGE: 'Экстренная повязка',
    SOULSTONE_FRAGMENT: 'Фрагмент камня душ',
    LAST_RESORT_SYRINGE: 'Шприц последнего шанса',
    NECROMANCERS_GIFT: 'Дар некроманта',
    BERSERKER_STIMULANT: 'Стимулятор берсерка',
});
