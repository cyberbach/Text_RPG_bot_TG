import { DEBUG_PORTAL } from './GameSetup.mjs';
import { AdjectiveWords } from './TextEnums/AdjectiveWords.mjs';

const PORTAL_NAME_PARTS = {
    SUFFIX: 'портал',
};

const PORTAL_DESCRIPTIONS = {
    WORLD_PORTAL: 'в иной мир',
    TELEPORT_PORTAL: 'в случайное место',
};

export class Portal {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.isWorldPortal = false;
        this.name = '';
    }

    setup(worldWidth, worldHeight, excludeX, excludeY, isWorldPortal = false) {
        this.x = Math.floor(Math.random() * worldWidth);
        this.y = Math.floor(Math.random() * worldHeight);

        while (this.x === excludeX && this.y === excludeY) {
            this.x = Math.floor(Math.random() * worldWidth);
            this.y = Math.floor(Math.random() * worldHeight);
        }

        this.isWorldPortal = isWorldPortal;
        
        const adjectives = Object.values(AdjectiveWords);
        const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
        this.name = `${randomAdj} ${PORTAL_NAME_PARTS.SUFFIX}`;

        if (DEBUG_PORTAL) {
            console.log('[PORTAL] World Portal:', this.name, '- coords:', this.x, '/', this.y);
        }
    }

    getPortalDescription() {
        const typeText = this.isWorldPortal ? PORTAL_DESCRIPTIONS.WORLD_PORTAL : PORTAL_DESCRIPTIONS.TELEPORT_PORTAL;
        return `${this.name} (${typeText})\n`;
    }
}
