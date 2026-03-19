import { RIDDLES, shuffleArray } from '../TextEnums/Riddles.mjs';
import { NPC_TYPE } from '../NPC.mjs';

const RIDDLES_PER_SESSION_MIN = 3;
const RIDDLES_PER_SESSION_MAX = 10;
const XP_REWARD_PERCENT = 0.1;

// Перемешать ответы, сохранив правильный
function shuffleAnswers(riddle) {
    const correctAnswer = riddle.answers[0];
    return {
        ...riddle,
        answers: shuffleArray(riddle.answers),
        correctAnswer: correctAnswer
    };
}

// Получить правильный ответ загадки
function getCorrectAnswer(riddle) {
    return riddle.correctAnswer;
}

// Начать сессию загадок со Сказочником
export function startRiddleSession(session, world, x, y) {
    const storyteller = world.npcs.find(npc => 
        npc.isStoryteller() && npc.x === x && npc.y === y
    );
    
    if (!storyteller) {
        return { error: 'Сказочник не найден' };
    }
    
    const totalRiddles = RIDDLES_PER_SESSION_MIN + 
        Math.floor(Math.random() * (RIDDLES_PER_SESSION_MAX - RIDDLES_PER_SESSION_MIN + 1));
    
    const shuffledRiddles = shuffleArray([...RIDDLES])
        .slice(0, totalRiddles)
        .map(shuffleAnswers);
    
    session.riddleState = {
        active: true,
        storytellerX: x,
        storytellerY: y,
        riddles: shuffledRiddles,
        currentIndex: 0,
        correctAnswers: 0,
        totalRiddles: totalRiddles
    };
    
    return { success: true };
}

// Обработать ответ на загадку
export function handleRiddleAnswer(params) {
    const { session, player, world, answer, updateGlobalStats, updatePlayerStats, STAT_EMOJI } = params;
    
    if (!session.riddleState || !session.riddleState.active) {
        return { message: 'Нет активной головоломки.', buttons: null };
    }
    
    const state = session.riddleState;
    const currentRiddle = state.riddles[state.currentIndex];
    const correctAnswer = getCorrectAnswer(currentRiddle);
    
    const isCorrect = answer === correctAnswer;
    
    if (isCorrect) {
        state.correctAnswers++;
    }
    
    let message = '';
    
    if (isCorrect) {
        message += `✨ Правильно! "${correctAnswer}" - верный ответ!\n`;
    } else {
        message += `❌ Неверно! Правильный ответ: "${correctAnswer}"\n`;
    }
    
    state.currentIndex++;
    
    if (state.currentIndex >= state.riddles.length) {
        const xpReward = Math.floor(player.getXPToNextLevel() * XP_REWARD_PERCENT * state.correctAnswers);
        
        if (xpReward > 0) {
            const result = player.addExperience(xpReward);
            message += `\n🎉 Головоломка завершена! Правильных ответов: ${state.correctAnswers}/${state.totalRiddles}\n`;
            message += `✨ Вы получили ${result.gained} Опыта!\n`;
            
            updateGlobalStats({ heroLevel: player.heroLevel });
            updatePlayerStats(session, { heroLevel: player.heroLevel });
        } else {
            message += `\n🎉 Головоломка завершена! Правильных ответов: ${state.correctAnswers}/${state.totalRiddles}\n`;
        }
        
        delete session.riddleState;
        
        const storyteller = world.npcs.find(npc => 
            npc.npcType === NPC_TYPE.STORYTELLER && 
            npc.x === state.storytellerX && 
            npc.y === state.storytellerY
        );
        if (storyteller) {
            storyteller.storytellerUsed = true;
        }
        
        const x = player.getX();
        const y = player.getY();
        
        message += '\n' + world.GetLocationText(x, y, player);
        message += player.getLocationCoords() + '\n';
        message += world.printWorldMap(x, y, player);
        
        return {
            message,
            buttons: null,
            riddleEnded: true,
            x,
            y
        };
    }
    
    return {
        message,
        buttons: null,
        riddleEnded: false,
        showNextRiddle: true
    };
}

// Получить текущую загадку для отображения
export function getCurrentRiddle(params) {
    const { session, world, STAT_EMOJI, generateInlineButtons } = params;
    
    if (!session.riddleState || !session.riddleState.active) {
        return { message: 'Нет активной головоломки.', buttons: null };
    }
    
    const state = session.riddleState;
    const currentRiddle = state.riddles[state.currentIndex];
    
    let message = '';
    message += `${STAT_EMOJI.MONSTER} ${world.npcs.find(npc => 
        npc.isStoryteller() && npc.x === state.storytellerX && npc.y === state.storytellerY
    )?.name || 'Сказочник'} говорит:\n\n`;
    message += `Загадка ${state.currentIndex + 1}/${state.totalRiddles}:\n`;
    message += `"${currentRiddle.question}"`;
    
    const answerButtons = currentRiddle.answers.map((answer, index) => ({
        text: answer,
        callback_data: `riddle_answer_${index}`
    }));
    
    const buttonsRows = [];
    for (let i = 0; i < answerButtons.length; i += 2) {
        const row = [answerButtons[i]];
        if (i + 1 < answerButtons.length) {
            row.push(answerButtons[i + 1]);
        }
        buttonsRows.push(row);
    }
    
    const buttons = {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: buttonsRows
        }
    };
    
    return { message, buttons };
}

// Проверить, активна ли сессия загадок
export function isRiddleActive(session) {
    return session.riddleState && session.riddleState.active;
}
