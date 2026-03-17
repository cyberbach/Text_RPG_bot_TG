export function PlayerAttackNPC(inWorld, inPlayer) {
    let attackResult = '';
    const x = inPlayer.getX();
    const y = inPlayer.getY();

    const npcs = inWorld.getNPCsAtLocation(x, y);
    npcs.forEach((oneNpc) => {
        if (Math.random() > 0.5) {
            const damageAmount = inPlayer.getAttackPower();
            const isAlive = oneNpc.modifyHealth(-damageAmount);
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
                attackResult += oneNpc.name + ' убит 💀\n';
                // drop item
                inWorld.generateOneItem(x, y);
            }
        } else {
            attackResult += inPlayer.name + ' промахнулся\n';
        }
    });

    return attackResult;
}

export function AllAgressiveNPCAttackPlayer(inWorld, inPlayer) {
    let attackResult = '';
    const x = inPlayer.getX();
    const y = inPlayer.getY();

    let isAlive = true;

    const npcs = inWorld.getNPCsAtLocation(x, y);
    npcs.forEach((oneNpc) => {
        if (isAlive) {
            if (Math.random() > 0.5) {
                if (oneNpc.agressive) {
                    const damageAmount =
                        oneNpc.minAttackPower +
                        Math.floor(
                            Math.random() *
                                (oneNpc.minAttackPower + oneNpc.maxAttackPower)
                        );

                    isAlive = inPlayer.modifyHealth(-damageAmount);
                    attackResult +=
                        oneNpc.name +
                        ' наносит ' +
                        damageAmount +
                        ' урона ' +
                        inPlayer.name +
                        '\n';

                    if (!isAlive) {
                        attackResult +=
                            inPlayer.name + ' убит 💀\n\nКОНЕЦ ИГРЫ!\n';
                    }
                }
            } else {
                attackResult += oneNpc.name + ' промахнулся\n';
            }
        }
    });

    return attackResult;
}
