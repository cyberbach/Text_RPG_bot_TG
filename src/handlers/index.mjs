// Экспорт всех обработчиков для центрального доступа из bot.mjs
export { handleMovement } from './MovementHandler.mjs';
export { handleCombat } from './CombatHandler.mjs';
export { handleItemUse, handleTakeAllItems } from './ItemHandler.mjs';
export { handleBuy, handleHelp } from './TradeHandler.mjs';
export { handlePortal } from './PortalHandler.mjs';
export { startRiddleSession, handleRiddleAnswer, getCurrentRiddle, isRiddleActive } from './RiddleHandler.mjs';
