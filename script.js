// Импортируем Supabase клиент
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@1.35.7/+esm'

// Инициализируем Supabase клиент
const supabaseUrl = 'https://tqthmgwbohenijykixzb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdGhtZ3dib2hlbmlqeWtpeHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk5NjcwMDIsImV4cCI6MjA0NTU0MzAwMn0.QNo46wvV64TCvILyvPRocMKAQjVH9QyZYmXo1SZAcWU'
const supabase = createClient(supabaseUrl, supabaseKey)

let userData = null;

// Функция для отображения отладочной информации
function debugLog(message) {
    const debugElement = document.getElementById('debug-info');
    const logEntry = document.createElement('div');
    logEntry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    debugElement.appendChild(logEntry);
    debugElement.scrollTop = debugElement.scrollHeight;
    console.log(message); // Оставляем вывод в консоль для дополнительной отладки
}

// Функция для получения Telegram ID из WebApp
function getTelegramId() {
    if (window.Telegram && window.Telegram.WebApp) {
        const webAppData = window.Telegram.WebApp.initDataUnsafe;
        debugLog('Telegram WebApp data: ' + JSON.stringify(webAppData));
        if (webAppData && webAppData.user && webAppData.user.id) {
            return webAppData.user.id.toString();
        }
    }
    debugLog('Telegram WebApp user data is not available');
    return null;
}

// Функция для получения или создания пользователя
async function getOrCreateUser() {
    const telegramId = getTelegramId();
    if (!telegramId) {
        debugLog('Failed to get Telegram ID');
        return null;
    }

    debugLog('Attempting to get user with ID: ' + telegramId);

    try {
        // Сначала пытаемся получить пользователя
        let { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', telegramId);

        if (error) throw error;

        // Если пользователь найден, возвращаем его
        if (data && data.length > 0) {
            debugLog('User found: ' + JSON.stringify(data[0]));
            return data[0];
        }

        // Если пользователь не найден, создаем нового
        debugLog('User not found, creating new user');

        const newUser = {
            id: telegramId,
            name: 'New Player',
            score: 0,
            tap_income: 1,
            max_energy: 1000,
            coins_for_up: 1000,
            hour_income: 3600,
            current_energy: 1000
        };

        const { data: createdUser, error: createError } = await supabase
            .from('users')
            .insert(newUser)
            .select()
            .single();

        if (createError) throw createError;

        debugLog('New user created: ' + JSON.stringify(createdUser));
        return createdUser;
    } catch (error) {
        debugLog('Error in getOrCreateUser: ' + error.message);
        return null;
    }
}

// Функция для обновления данных пользователя
async function updateUserData(updates) {
    const telegramId = getTelegramId();
    if (!telegramId) {
        debugLog('Failed to get Telegram ID for update');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', telegramId)
            .single();

        if (error) throw error;

        userData = { ...userData, ...updates };
        updateDisplay();
        debugLog('User data updated successfully');
    } catch (error) {
        debugLog('Error updating user data: ' + error.message);
    }
}

// Функция для обновления отображения
function updateDisplay() {
    if (!userData) return;

    document.querySelector('.current-energy').textContent = userData.current_energy;
    document.querySelector('.count__txt').textContent = userData.score;
    document.querySelector('.tap-income').textContent = userData.tap_income;
    document.querySelector('.coins-for-up').textContent = userData.coins_for_up;
    document.querySelector('.hour-income').textContent = userData.hour_income;
    document.querySelector('.max-energy').textContent = userData.max_energy;
}

// Инициализация приложения
async function initApp() {
    debugLog('Initializing app...');
    
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        debugLog('Telegram WebApp is ready');
        debugLog('User: ' + JSON.stringify(window.Telegram.WebApp.initDataUnsafe.user));
    } else {
        debugLog('Telegram WebApp is not available');
        return; // Прекращаем выполнение, если WebApp недоступен
    }

    try {
        userData = await getOrCreateUser();
        if (!userData) {
            debugLog('Failed to initialize user data');
            return;
        }

        debugLog('User data initialized: ' + JSON.stringify(userData));
        updateDisplay();

        // Обновление энергии
        setInterval(async function refillEnergy() {
            if (!userData) return; // Проверка на наличие userData
            if (userData.current_energy <= userData.max_energy - 3) {
                userData.current_energy += 3;
                await updateUserData({ current_energy: userData.current_energy });
            } else if (userData.current_energy < userData.max_energy) {
                userData.current_energy = userData.max_energy;
                await updateUserData({ current_energy: userData.current_energy });
            }
        }, 3000);

        // Пассивный доход
        setInterval(async function farmMoney() {
            if (!userData) return; // Проверка на наличие userData
            const secondIncome = Math.round(userData.hour_income / 3600);
            userData.score += secondIncome;
            await updateUserData({ score: userData.score });
        }, 1000);
    } catch (error) {
        debugLog('Error during app initialization: ' + error.message);
    }
}

// Обработчик клика по кнопке
document.querySelector('.button__img').addEventListener('click', async function (event) {
    event.preventDefault();
    event.stopPropagation();

    if (userData && userData.current_energy >= userData.tap_income) {
        userData.current_energy -= userData.tap_income;
        userData.score += userData.tap_income;
        await updateUserData({
            current_energy: userData.current_energy,
            score: userData.score
        });
    } else {
        debugLog('Not enough energy or user data not initialized');
    }
});

// Функция апгрейда
async function upgrade() {
    if (userData && userData.score >= userData.coins_for_up) {
        const oldScore = userData.score;
        const oldCoinsForUp = userData.coins_for_up;
        const oldHourIncome = userData.hour_income;
        const oldMaxEnergy = userData.max_energy;
        const oldTapIncome = userData.tap_income;

        userData.score -= userData.coins_for_up;
        userData.coins_for_up += 10000;
        userData.hour_income += 3600;
        userData.max_energy += 1000;
        userData.tap_income++;

        try {
            await updateUserData({
                score: userData.score,
                coins_for_up: userData.coins_for_up,
                hour_income: userData.hour_income,
                max_energy: userData.max_energy,
                tap_income: userData.tap_income
            });

            debugLog(`Апгрейд успешен! Новый часовой доход: ${userData.hour_income}`);
        } catch (error) {
            // Если произошла ошибка, возвращаем старые значения
            userData.score = oldScore;
            userData.coins_for_up = oldCoinsForUp;
            userData.hour_income = oldHourIncome;
            userData.max_energy = oldMaxEnergy;
            userData.tap_income = oldTapIncome;
            debugLog('Ошибка при выполнении апгрейда: ' + error.message);
        }
    } else {
        debugLog("Недостаточно монет для апгрейда или пользовательские данные не инициализированы.");
    }
}

document.querySelector('.footer__upgrade').addEventListener("click", upgrade);

// Запускаем приложение
document.addEventListener('DOMContentLoaded', initApp);
