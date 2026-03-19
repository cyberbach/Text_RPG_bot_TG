import { WorldGenerator } from './src/World.mjs';
import { Player } from './src/Player.mjs';
import { DIRECTIONS } from './src/MovementDirections.mjs';
import { NPC } from './src/NPC.mjs';
import { PLAYER_SETTINGS } from './src/GameSetup.mjs';

const WORLD_MOBILE_WIDTH = 13; // 13 максимум на телефоне
const WORLD_MOBILE_HEIGHT = 10;
const WORLD_PC_WIDTH = 22;
const WORLD_PC_HEIGHT = 16;

// Инициализация лабиринта
const world = new WorldGenerator();
const player = new Player();

world.setup(WORLD_MOBILE_WIDTH, WORLD_MOBILE_HEIGHT);
world.generate();
player.setup(WORLD_MOBILE_WIDTH, WORLD_MOBILE_HEIGHT);
player.clearAttributes();
player.setRandomLocation();
player.markAreaVisible(player.getX(), player.getY(), PLAYER_SETTINGS.VISIBILITY_WIDTH, PLAYER_SETTINGS.VISIBILITY_HEIGHT);

function LocationAbout() {
    const x = player.getX();
    const y = player.getY();
    const locationName = world.getLocationByXY(x, y);
    const locationDescription = world.getLocationDescriptionByXY(x, y);

    console.log('Location: ', locationName);
    console.log('About:', locationDescription);
}

console.log(world.printWorldMap(player.getX(), player.getY(), player));

LocationAbout();
player.move(DIRECTIONS.DOWN);
LocationAbout();
player.move(DIRECTIONS.DOWN);
LocationAbout();
player.move(DIRECTIONS.DOWN);

//maze.printMaze()

// for (let index = 0; index < 20; index++) {
//     let npc = new NPC();
//     npc.setup(WORLD_MOBILE_WIDTH, WORLD_MOBILE_HEIGHT);
// }
