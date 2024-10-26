import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Инициализация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDzwDUN9-X9B4uTxomjJAz4oNIREEVXYqo",
  authDomain: "shovel-coin.firebaseapp.com",
  projectId: "shovel-coin",
  storageBucket: "shovel-coin.appspot.com",
  messagingSenderId: "485128858471",
  appId: "1:485128858471:web:601e1787a95ec9bdea5dc2",
  measurementId: "G-77Z9QR30EK"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let currentUser = null;

// ... остальные объявления переменных остаются без изменений ...

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
function authenticateUser(telegramId) {
    currentUser = { uid: telegramId };
    loadUserData();
    startGameLoops();
}

// Функция для запуска игровых циклов
function startGameLoops() {
    setInterval(refillEnergy, 3000);
    setInterval(farmMoney, 1000);
}

// Функция для загрузки данных пользователя
async function loadUserData() {
    const userDoc = doc(db, 'users', currentUser.uid);
    const docSnap = await getDoc(userDoc);

    if (docSnap.exists()) {
        const data = docSnap.data();
        updateUI(data);
    } else {
        initializeUserData();
    }
}

// Функция для инициализации данных нового пользователя
async function initializeUserData() {
    const initialData = {
        tapIncome: 1,
        maxEnergy: 1000,
        coinsForUp: 1000,
        coinCount: 0,
        hourIncome: 3600,
        currentEnergy: 1000
    };
    
    const userDoc = doc(db, 'users', currentUser.uid);
    await setDoc(userDoc, initialData);
    updateUI(initialData);
}

// Функция для обновления UI
function updateUI(data) {
    currentEnergyTxt.textContent = data.currentEnergy;
    countTxt.textContent = data.coinCount;
    tapIncomeTxt.textContent = data.tapIncome;
    coinsForUpTxt.textContent = data.coinsForUp;
    hourIncomeTxt.textContent = data.hourIncome;
    maxEnergyTxt.textContent = data.maxEnergy;
}

// Функция для обновления данных в Firebase
async function updateFirebase(updates) {
    const userDoc = doc(db, 'users', currentUser.uid);
    await updateDoc(userDoc, updates);
}

// Обновляем функцию refillEnergy
async function refillEnergy() {
    if (!currentUser) return;
    const userDoc = doc(db, 'users', currentUser.uid);
    const docSnap = await getDoc(userDoc);
    const data = docSnap.data();
    let currentEnergy = data.currentEnergy;
    const maxEnergy = data.maxEnergy;
    
    if (currentEnergy <= maxEnergy - 3) {
        currentEnergy += 3;
    } else {
        currentEnergy = maxEnergy;
    }
    
    await updateFirebase({ currentEnergy: currentEnergy });
    currentEnergyTxt.textContent = currentEnergy;
}

// Обновляем обработчик клика по кнопке
document.addEventListener('DOMContentLoaded', () => {
    button.addEventListener('click', async function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (!currentUser) return;

        const userDoc = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userDoc);
        const data = docSnap.data();
        let currentEnergy = data.currentEnergy;
        const tapIncome = data.tapIncome;
        let coinCount = data.coinCount;

        if (currentEnergy >= tapIncome) {
            currentEnergy -= tapIncome;
            coinCount += tapIncome;

            await updateFirebase({
                currentEnergy: currentEnergy,
                coinCount: coinCount
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
    const userDoc = doc(db, 'users', currentUser.uid);
    const docSnap = await getDoc(userDoc);
    const data = docSnap.data();
    let coinCount = data.coinCount;
    let coinsForUpgrade = data.coinsForUp;
    
    if (coinCount >= coinsForUpgrade) {
        coinCount -= coinsForUpgrade;
        coinsForUpgrade += 10000;
        
        const updates = {
            coinCount: coinCount,
            coinsForUp: coinsForUpgrade,
            hourIncome: data.hourIncome + 3600,
            maxEnergy: data.maxEnergy + 1000,
            tapIncome: data.tapIncome + 1
        };
        
        await updateFirebase(updates);
        updateUI({ ...data, ...updates });
        
        console.log(`Upgrade successful! New hour income: ${updates.hourIncome}`);
    } else {
        console.log("Not enough coins for upgrade.");
    }
}

// Обновляем функцию farmMoney
async function farmMoney() {
    if (!currentUser) return;
    const userDoc = doc(db, 'users', currentUser.uid);
    const docSnap = await getDoc(userDoc);
    const data = docSnap.data();
    let hourIncome = data.hourIncome;
    let coins = data.coinCount;

    let secondIncome = Math.round(hourIncome / 3600);
    coins += secondIncome;

    console.log(`Passive income per second: ${secondIncome}`);
    console.log(`New coin count: ${coins}`);

    await updateFirebase({ coinCount: coins });
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

// ... остальной код остается без изменений ...
