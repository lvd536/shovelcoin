import { createClient } from '@supabase/supabase-js'

// Инициализация Supabase
const supabaseUrl = 'https://tqthmgwbohenijykixzb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdGhtZ3dib2hlbmlqeWtpeHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk5NjcwMDIsImV4cCI6MjA0NTU0MzAwMn0.QNo46wvV64TCvILyvPRocMKAQjVH9QyZYmXo1SZAcWU'
const supabase = createClient(supabaseUrl, supabaseKey)

let currentUser = null;

// Объявляем переменные для элементов DOM
let button, upgradeButton, currentEnergyTxt, countTxt, tapIncomeTxt, coinsForUpTxt, hourIncomeTxt, maxEnergyTxt;

// Функция для инициализации элементов DOM
function initializeDOMElements() {
    button = document.querySelector('.button__img');
    upgradeButton = document.querySelector('.footer__upgrade');
    currentEnergyTxt = document.querySelector('.current-energy');
    countTxt = document.querySelector('.count__txt');
    tapIncomeTxt = document.querySelector('.tap-income');
    coinsForUpTxt = document.querySelector('.coins-for-up');
    hourIncomeTxt = document.querySelector('.hour-income');
    maxEnergyTxt = document.querySelector('.max-energy');
}

// Функция для аутентификации пользователя по Telegram ID
async function authenticateUser(telegramId) {
    currentUser = { id: telegramId };
    await loadUserData();
    startGameLoops();
}

// Функция для запуска игровых циклов
function startGameLoops() {
    setInterval(refillEnergy, 3000);
    setInterval(farmMoney, 1000);
}

// Функция для загрузки данных пользователя
async function loadUserData() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

    if (error) {
        console.error("Ошибка при загрузке данных:", error);
        return;
    }

    if (data) {
        updateUI(data);
    } else {
        await initializeUserData();
    }
}

// Функция для инициализации данных нового пользователя
async function initializeUserData() {
    const initialData = {
        id: currentUser.id,
        tap_income: 1,
        max_energy: 1000,
        coins_for_up: 1000,
        coin_count: 0,
        hour_income: 3600,
        current_energy: 1000
    };
    
    const { data, error } = await supabase
        .from('users')
        .insert([initialData]);

    if (error) {
        console.error("Ошибка при инициализации данных:", error);
        return;
    }

    updateUI(initialData);
}

// Функция для обновления UI
function updateUI(data) {
    currentEnergyTxt.textContent = data.current_energy;
    countTxt.textContent = data.coin_count;
    tapIncomeTxt.textContent = data.tap_income;
    coinsForUpTxt.textContent = data.coins_for_up;
    hourIncomeTxt.textContent = data.hour_income;
    maxEnergyTxt.textContent = data.max_energy;
}

// Функция для обновления данных в Supabase
async function updateSupabase(updates) {
    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', currentUser.id);

    if (error) {
        console.error("Ошибка при обновлении данных:", error);
    }
}

// Обновляем функцию refillEnergy
async function refillEnergy() {
    if (!currentUser) return;
    
    const { data, error } = await supabase
        .from('users')
        .select('current_energy, max_energy')
        .eq('id', currentUser.id)
        .single();

    if (error) {
        console.error("Ошибка при получении данных:", error);
        return;
    }

    let currentEnergy = data.current_energy;
    const maxEnergy = data.max_energy;
    
    if (currentEnergy <= maxEnergy - 3) {
        currentEnergy += 3;
    } else {
        currentEnergy = maxEnergy;
    }
    
    await updateSupabase({ current_energy: currentEnergy });
    currentEnergyTxt.textContent = currentEnergy;
}

// Обновляем обработчик клика по кнопке
document.addEventListener('DOMContentLoaded', () => {
    button.addEventListener('click', async function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (!currentUser) return;

        const { data, error } = await supabase
            .from('users')
            .select('current_energy, tap_income, coin_count')
            .eq('id', currentUser.id)
            .single();

        if (error) {
            console.error("Ошибка при получении данных:", error);
            return;
        }

        let currentEnergy = data.current_energy;
        const tapIncome = data.tap_income;
        let coinCount = data.coin_count;

        if (currentEnergy >= tapIncome) {
            currentEnergy -= tapIncome;
            coinCount += tapIncome;

            await updateSupabase({
                current_energy: currentEnergy,
                coin_count: coinCount
            });

            currentEnergyTxt.textContent = currentEnergy;
            countTxt.textContent = coinCount;
        }
    });

    // Добавляем обработчик для кнопки апгрейда
    upgradeButton.addEventListener('click', upgrade);
});

// Обновляем функцию upgrade
async function upgrade() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

    if (error) {
        console.error("Ошибка при получении данных:", error);
        return;
    }

    let coinCount = data.coin_count;
    let coinsForUpgrade = data.coins_for_up;
    
    if (coinCount >= coinsForUpgrade) {
        coinCount -= coinsForUpgrade;
        coinsForUpgrade += 10000;
        
        const updates = {
            coin_count: coinCount,
            coins_for_up: coinsForUpgrade,
            hour_income: data.hour_income + 3600,
            max_energy: data.max_energy + 1000,
            tap_income: data.tap_income + 1
        };
        
        await updateSupabase(updates);
        updateUI({ ...data, ...updates });
        
        console.log(`Upgrade successful! New hour income: ${updates.hour_income}`);
    } else {
        console.log("Not enough coins for upgrade.");
    }
}

// Обновляем функцию farmMoney
async function farmMoney() {
    if (!currentUser) return;

    const { data, error } = await supabase
        .from('users')
        .select('hour_income, coin_count')
        .eq('id', currentUser.id)
        .single();

    if (error) {
        console.error("Ошибка при получении данных:", error);
        return;
    }

    let hourIncome = data.hour_income;
    let coins = data.coin_count;

    let secondIncome = Math.round(hourIncome / 3600);
    coins += secondIncome;

    console.log(`Passive income per second: ${secondIncome}`);
    console.log(`New coin count: ${coins}`);

    await updateSupabase({ coin_count: coins });
    countTxt.textContent = coins;
}

// Функция для получения Telegram ID из URL
function getTelegramIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Запускаем аутентификацию при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initializeDOMElements();
    const telegramId = getTelegramIdFromUrl();
    if (telegramId) {
        authenticateUser(telegramId);
    } else {
        console.error("Telegram ID не найден в URL");
    }
});
