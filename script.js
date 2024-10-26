// Импортируем Supabase клиент
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@1.35.7/+esm'

// Инициализируем Supabase клиент
const supabaseUrl = 'https://tqthmgwbohenijykixzb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdGhtZ3dib2hlbmlqeWtpeHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk5NjcwMDIsImV4cCI6MjA0NTU0MzAwMn0.QNo46wvV64TCvILyvPRocMKAQjVH9QyZYmXo1SZAcWU'
const supabase = createClient(supabaseUrl, supabaseKey)

let userData = null;

const debugInfo = document.getElementById('debug-info');
const toggleDebugBtn = document.getElementById('toggle-debug');

function debugLog(message) {
    const logEntry = document.createElement('div');
    logEntry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    debugInfo.appendChild(logEntry);
    debugInfo.scrollTop = debugInfo.scrollHeight;
    console.log(message);
}

toggleDebugBtn.addEventListener('click', () => {
    debugInfo.classList.toggle('hidden');
});

function getTelegramId() {
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        return window.Telegram.WebApp.initDataUnsafe.user.id.toString();
    }
    debugLog('Telegram WebApp user data is not available');
    return null;
}

const upgrades = {
    passiveIncome: { name: 'Пассивный доход', baseCost: 100, increment: 1.5, effect: 10 },
    clickPower: { name: 'Сила клика', baseCost: 50, increment: 1.3, effect: 1 },
    maxEnergy: { name: 'Макс. энергия', baseCost: 200, increment: 1.4, effect: 100 },
    energyRegen: { name: 'Восст. энергии', baseCost: 150, increment: 1.6, effect: 1 }
};

const ranks = [
    { name: 'Новичок', requirement: 0 },
    { name: 'Любитель', requirement: 1000 },
    { name: 'Профессионал', requirement: 10000 },
    { name: 'Мастер', requirement: 100000 },
    { name: 'Легенда', requirement: 1000000 }
];

async function getOrCreateUser() {
    const telegramId = getTelegramId();
    if (!telegramId) {
        debugLog('Failed to get Telegram ID');
        return null;
    }

    try {
        let { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', telegramId);

        if (error) throw error;

        if (data && data.length > 0) {
            debugLog('User found: ' + JSON.stringify(data[0]));
            return data[0];
        }

        const newUser = {
            id: telegramId,
            name: 'New Player',
            score: 0,
            tap_income: 1,
            max_energy: 1000,
            coins_for_up: 1000,
            hour_income: 3600,
            current_energy: 1000,
            total_earned: 0,
            rank: 0,
            upgrade_levels: {
                passiveIncome: 0,
                clickPower: 0,
                maxEnergy: 0,
                energyRegen: 0
            }
        };

        const { data: createdUser, error: createError } = await supabase
            .from('users')
            .insert([newUser])
            .select();

        if (createError) throw createError;

        debugLog('New user created: ' + JSON.stringify(createdUser[0]));
        return createdUser[0];
    } catch (error) {
        debugLog('Error in getOrCreateUser: ' + error.message);
        return null;
    }
}

async function updateUserData(updates) {
    if (!userData?.id) {
        debugLog('User data not initialized');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userData.id)
            .select();

        if (error) throw error;

        if (data && data.length > 0) {
            userData = { ...userData, ...data[0] };
            updateDisplay();
            debugLog('User data updated successfully');
        } else {
            throw new Error('No data returned after update');
        }
    } catch (error) {
        debugLog('Error updating user data: ' + error.message);
    }
}

function updateDisplay() {
    if (!userData) return;

    gsap.to('.current-energy', { textContent: Math.floor(userData.current_energy), duration: 0.5, snap: { textContent: 1 } });
    gsap.to('.count__txt', { textContent: Math.floor(userData.score), duration: 0.5, snap: { textContent: 1 } });
    gsap.to('.tap-income', { textContent: userData.tap_income, duration: 0.5, snap: { textContent: 1 } });
    gsap.to('.coins-for-up', { textContent: userData.coins_for_up, duration: 0.5, snap: { textContent: 1 } });
    gsap.to('.hour-income', { textContent: userData.hour_income, duration: 0.5, snap: { textContent: 1 } });
    gsap.to('.max-energy', { textContent: userData.max_energy, duration: 0.5, snap: { textContent: 1 } });
    updateUpgradeButtons();
    updateRankDisplay();
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.remove('hidden');
    gsap.fromTo(notification, 
        { y: -50, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
    );
    setTimeout(() => {
        gsap.to(notification, { y: -50, opacity: 0, duration: 0.5, onComplete: () => {
            notification.classList.add('hidden');
        }});
    }, 3000);
}

function updateUpgradeButtons() {
    for (const [key, upgrade] of Object.entries(upgrades)) {
        const level = userData.upgrade_levels[key];
        const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.increment, level));
        const button = document.getElementById(`upgrade-${key}`);
        button.textContent = `${upgrade.name} (Ур. ${level})\nСтоимость: ${cost}`;
        button.disabled = userData.score < cost;
    }
}

function updateRankDisplay() {
    const currentRank = ranks[userData.rank];
    const nextRank = ranks[userData.rank + 1];
    document.getElementById('current-rank').textContent = currentRank.name;
    
    if (nextRank) {
        const progress = (userData.total_earned - currentRank.requirement) / (nextRank.requirement - currentRank.requirement);
        gsap.to('#rank-progress', { width: `${progress * 100}%`, duration: 0.5 });
        document.getElementById('next-rank').textContent = nextRank.name;
    } else {
        gsap.to('#rank-progress', { width: '100%', duration: 0.5 });
        document.getElementById('next-rank').textContent = 'Максимальный ранг';
    }
}

function checkRankUp() {
    const nextRank = ranks[userData.rank + 1];
    if (nextRank && userData.total_earned >= nextRank.requirement) {
        userData.rank++;
        updateRankDisplay();
        showNotification(`Поздравляем! Вы достигли ранга "${ranks[userData.rank].name}"!`);
        gsap.from('.rank-info', { scale: 1.1, duration: 0.5, ease: "elastic.out(1, 0.3)" });
    }
}

async function performUpgrade(upgradeKey) {
    const upgrade = upgrades[upgradeKey];
    const level = userData.upgrade_levels[upgradeKey];
    const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.increment, level));
    
    if (userData.score >= cost) {
        userData.score -= cost;
        userData.upgrade_levels[upgradeKey]++;
        
        switch (upgradeKey) {
            case 'passiveIncome':
                userData.hour_income += upgrade.effect;
                break;
            case 'clickPower':
                userData.tap_income += upgrade.effect;
                break;
            case 'maxEnergy':
                userData.max_energy += upgrade.effect;
                break;
            case 'energyRegen':
                // Эффект будет применен в функции refillEnergy
                break;
        }
        
        await updateUserData({
            score: userData.score,
            upgrade_levels: userData.upgrade_levels,
            hour_income: userData.hour_income,
            tap_income: userData.tap_income,
            max_energy: userData.max_energy
        });
        
        updateDisplay();
        showNotification(`Улучшение "${upgrade.name}" выполнено!`);
        gsap.from(`#upgrade-${upgradeKey}`, { scale: 1.1, duration: 0.3, ease: "back.out(1.7)" });
    }
}

async function initApp() {
    debugLog('Initializing app...');
    
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        debugLog('Telegram WebApp is ready');
    } else {
        debugLog('Telegram WebApp is not available');
        return;
    }

    try {
        userData = await getOrCreateUser();
        if (!userData) {
            debugLog('Failed to initialize user data');
            return;
        }

        updateDisplay();

        setInterval(async function refillEnergy() {
            if (!userData) return;
            const energyRegenRate = 1 + userData.upgrade_levels.energyRegen * upgrades.energyRegen.effect;
            if (userData.current_energy < userData.max_energy) {
                userData.current_energy = Math.min(userData.current_energy + energyRegenRate, userData.max_energy);
                await updateUserData({ current_energy: userData.current_energy });
                updateDisplay();
            }
        }, 1000);

        setInterval(async function farmMoney() {
            if (!userData) return;
            const secondIncome = Math.round(userData.hour_income / 3600);
            userData.score += secondIncome;
            userData.total_earned += secondIncome;
            await updateUserData({ score: userData.score, total_earned: userData.total_earned });
            checkRankUp();
            updateDisplay();
        }, 1000);
    } catch (error) {
        debugLog('Error during app initialization: ' + error.message);
    }
}

document.querySelector('.button__img').addEventListener('click', async function (event) {
    event.preventDefault();
    if (userData?.current_energy >= userData.tap_income) {
        userData.current_energy -= userData.tap_income;
        userData.score += userData.tap_income;
        userData.total_earned += userData.tap_income;
        await updateUserData({
            current_energy: userData.current_energy,
            score: userData.score,
            total_earned: userData.total_earned
        });
        checkRankUp();
        gsap.from(event.currentTarget, { scale: 0.95, duration: 0.1, ease: "back.out(1.7)" });
        gsap.to('.count__txt', { scale: 1.1, duration: 0.1, yoyo: true, repeat: 1 });
    } else {
        showNotification('Недостаточно энергии!');
    }
});

for (const key of Object.keys(upgrades)) {
    document.getElementById(`upgrade-${key}`).addEventListener('click', () => performUpgrade(key));
}

document.addEventListener('DOMContentLoaded', initApp);

document.querySelector('.footer__upgrade').addEventListener('click', () => {
    const upgradesElement = document.querySelector('.upgrades');
    upgradesElement.classList.toggle('hidden');
    if (!upgradesElement.classList.contains('hidden')) {
        updateUpgradeButtons();
        gsap.from('.upgrades', { scale: 0.9, opacity: 0, duration: 0.3, ease: "back.out(1.7)" });
    }
});
