// Импортируем Supabase клиент
import { createClient } from '@supabase/supabase-js'

// Инициализируем Supabase клиент
const supabaseUrl = 'https://tqthmgwbohenijykixzb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdGhtZ3dib2hlbmlqeWtpeHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk5NjcwMDIsImV4cCI6MjA0NTU0MzAwMn0.QNo46wvV64TCvILyvPRocMKAQjVH9QyZYmXo1SZAcWU'
const supabase = createClient(supabaseUrl, supabaseKey)

let userData = null;

// Функция для получения Telegram ID из WebApp
function getTelegramId() {
    if (window.Telegram && window.Telegram.WebApp) {
        return window.Telegram.WebApp.initDataUnsafe.user.id.toString();
    }
    console.error('Telegram WebApp is not available');
    return null;
}

// Функция для получения или создания пользователя
async function getOrCreateUser() {
    const telegramId = getTelegramId();
    if (!telegramId) {
        console.error('Failed to get Telegram ID');
        return null;
    }

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', telegramId)
        .single();

    if (error || !data) {
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
            .single();

        if (createError) {
            console.error('Error creating user:', createError);
            return null;
        }

        return createdUser;
    }

    return data;
}

// Функция для обновления данных пользователя
async function updateUserData(updates) {
    const telegramId = getTelegramId();
    if (!telegramId) {
        console.error('Failed to get Telegram ID for update');
        return;
    }

    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', telegramId)
        .single();

    if (error) {
        console.error('Error updating user data:', error);
    } else {
        userData = { ...userData, ...updates };
        updateDisplay();
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
    // Ждем, пока Telegram WebApp будет готов
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        console.log('Telegram WebApp is ready');
        console.log('User:', window.Telegram.WebApp.initDataUnsafe.user);
    } else {
        console.error('Telegram WebApp is not available');
    }

    userData = await getOrCreateUser();
    if (!userData) {
        console.error('Failed to initialize user data');
        return;
    }

    updateDisplay();

    // Обновление энергии
    setInterval(async function refillEnergy() {
        if (userData.current_energy <= userData.max_energy - 3) {
            userData.current_energy += 3;
            await updateUserData({ current_energy: userData.current_energy });
        } else {
            userData.current_energy = userData.max_energy;
            await updateUserData({ current_energy: userData.current_energy });
        }
    }, 3000);

    // Пассивный доход
    setInterval(async function farmMoney() {
        const secondIncome = Math.round(userData.hour_income / 3600);
        userData.score += secondIncome;
        await updateUserData({ score: userData.score });
    }, 1000);
}

// Обработчик клика по кнопке
document.querySelector('.button__img').addEventListener('click', async function (event) {
    event.preventDefault();
    event.stopPropagation();

    if (userData.current_energy >= userData.tap_income) {
        userData.current_energy -= userData.tap_income;
        userData.score += userData.tap_income;
        await updateUserData({
            current_energy: userData.current_energy,
            score: userData.score
        });
    }
});

// Функция апгрейда
async function upgrade() {
    if (userData.score >= userData.coins_for_up) {
        userData.score -= userData.coins_for_up;
        userData.coins_for_up += 10000;
        userData.hour_income += 3600;
        userData.max_energy += 1000;
        userData.tap_income++;

        await updateUserData({
            score: userData.score,
            coins_for_up: userData.coins_for_up,
            hour_income: userData.hour_income,
            max_energy: userData.max_energy,
            tap_income: userData.tap_income
        });

        console.log(`Апгрейд успешен! Новый часовой доход: ${userData.hour_income}`);
    } else {
        console.log("Недостаточно монет для апгрейда.");
    }
}

document.querySelector('.footer__upgrade').addEventListener("click", upgrade);

// Запускаем приложение
document.addEventListener('DOMContentLoaded', initApp);
