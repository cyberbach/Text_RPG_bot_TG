export function PlayerAttackNPC(inWorld, inPlayer) {
    let attackResult = '';
    let stats = { damageDealt: 0, monstersKilled: 0 };
    const x = inPlayer.getX();
    const y = inPlayer.getY();

    const npcs = inWorld.getNPCsAtLocation(x, y);
    npcs.forEach((oneNpc) => {
        if (Math.random() > 0.5) {
            const damageAmount = inPlayer.getAttackPower();
            const isAlive = oneNpc.modifyHealth(-damageAmount);
            inPlayer.addExperienceForAction(5);
            stats.damageDealt += damageAmount;
            attackResult +=
                inPlayer.name +
                ' наносит ' +
                damageAmount +
                ' урона ' +
                oneNpc.name +
                '\n';
            if (!isAlive) {
                const indexToRemove = inWorld.npcs.findIndex(
                    (npc) => npc === oneNpc
                );
                inWorld.npcs.splice(indexToRemove, 1);
                stats.monstersKilled++;
                attackResult += oneNpc.name + ' убит 💀\n';
                inWorld.generateOneItem(x, y);
            }
        } else {
            inPlayer.addExperienceForAction(1);
            attackResult += inPlayer.name + ' промахнулся\n';
        }
    });

    return { text: attackResult, stats };
}

export function AllAgressiveNPCAttackPlayer(inWorld, inPlayer, attackX, attackY) {
    let attackResult = '';
    let stats = { damageTaken: 0, playerDied: false };
    const x = attackX !== undefined ? attackX : inPlayer.getX();
    const y = attackY !== undefined ? attackY : inPlayer.getY();

    let isAlive = true;

    const npcs = inWorld.getNPCsAtLocation(x, y);
    npcs.forEach((oneNpc) => {
        if (isAlive) {
            if (Math.random() > 0.5) {
                if (oneNpc.agressive) {
                    const damageAmount =
                        Math.min(oneNpc.minAttackPower, oneNpc.maxAttackPower) +
                        Math.floor(
                            Math.random() *
                                (Math.abs(oneNpc.maxAttackPower - oneNpc.minAttackPower) + 1)
                        );

                    isAlive = inPlayer.modifyHealth(-damageAmount);
                    stats.damageTaken += damageAmount;
                    attackResult +=
                        oneNpc.name +
                        ' наносит ' +
                        damageAmount +
                        ' урона ' +
                        inPlayer.name +
                        '\n';

                    if (!isAlive) {
                        stats.playerDied = true;
                        attackResult +=
                            inPlayer.name + ' убит 💀\n\nКОНЕЦ ИГРЫ!\n';
                    }
                }
            } else {
                attackResult += oneNpc.name + ' промахнулся\n';
            }
        }
    });

    return { text: attackResult, stats };
}
