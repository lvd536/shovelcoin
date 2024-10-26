let button = document.querySelector(".button");
let countTxt = document.querySelector(".count__txt");

let tapIncomeTxt = document.querySelector(".tap-income");
let coinsForUpTxt = document.querySelector(".coins-for-up");
let hourIncomeTxt = document.querySelector(".hour-income");

let currentEnergyTxt = document.querySelector(".current-energy");
let maxEnergyTxt = document.querySelector(".max-energy");

let upgradeButton = document.querySelector(".upgrade__button");

let coinsForUpgrade = 1000;

function fillLocalStorage(key, defaultValue) {
    if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, defaultValue);
    }
}

fillLocalStorage("tap-income", 1);
fillLocalStorage("max-energy", 1000);
fillLocalStorage("coins-for-up", 1000);
fillLocalStorage("coin-count", 0);
fillLocalStorage("hour-income", 3600);
fillLocalStorage("current-energy", localStorage.getItem("max-energy"));

let maxEnergy = +localStorage.getItem("max-energy");

currentEnergyTxt.textContent = localStorage.getItem("current-energy");
countTxt.textContent = localStorage.getItem("coin-count");
tapIncomeTxt.textContent = localStorage.getItem("tap-income");
coinsForUpTxt.textContent = localStorage.getItem("coins-for-up");
hourIncomeTxt.textContent = localStorage.getItem("hour-income");
maxEnergyTxt.textContent = localStorage.getItem("max-energy");

setInterval(function refillEnergy() {
    let currentEnergy = +localStorage.getItem("current-energy");
    if (currentEnergy <= maxEnergy - 3) {
        currentEnergy += 3;
        localStorage.setItem("current-energy", currentEnergy);
        currentEnergyTxt.textContent = currentEnergy;
    } else {
        localStorage.setItem("current-energy", maxEnergy);
        currentEnergyTxt.textContent = maxEnergy;
    }
}, 3000);

button.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();

    let currentEnergy = +localStorage.getItem("current-energy");
    let tapIncome = +localStorage.getItem("tap-income");

    if (currentEnergy >= tapIncome) {
        currentEnergy -= tapIncome;
        localStorage.setItem("current-energy", currentEnergy);
        currentEnergyTxt.textContent = currentEnergy;

        let count = +localStorage.getItem("coin-count");
        count += tapIncome;
        localStorage.setItem("coin-count", count);
        countTxt.textContent = count;
    }
});

function upgrade() {
    let count = +localStorage.getItem("coin-count");
    if (count >= coinsForUpgrade) {
        count -= coinsForUpgrade;
        coinsForUpgrade += 10000;

        let passiveIncome = +localStorage.getItem("hour-income");
        passiveIncome += 3600;

        maxEnergy += 1000;

        let tapIncome = +localStorage.getItem("tap-income");
        tapIncome++;

        localStorage.setItem("coins-for-up", coinsForUpgrade);
        localStorage.setItem("hour-income", passiveIncome);
        localStorage.setItem("coin-count", count);
        localStorage.setItem("tap-income", tapIncome);
        localStorage.setItem("max-energy", maxEnergy);

        countTxt.textContent = count;
        tapIncomeTxt.textContent = tapIncome;
        coinsForUpTxt.textContent = coinsForUpgrade;
        hourIncomeTxt.textContent = passiveIncome;
        maxEnergyTxt.textContent = maxEnergy;

        console.log(`Upgrade successful! New hour income: ${passiveIncome}`);

        // Получаем имя игрока из Telegram WebApp
        const playerName = window.Telegram.WebApp.initDataUnsafe.user.username || "Anonymous";
        updatePlayerScore(playerName, count);

        // Сохраняем данные после апгрейда
        saveUserData();
    } else {
        console.log("Not enough coins for upgrade.");
    }
}
 
setInterval(function farmMoney() {
    let hourIncome = +localStorage.getItem("hour-income");
    let coins = +localStorage.getItem("coin-count");

    let secondIncome = Math.round(hourIncome / 3600);
    coins += secondIncome;

    console.log(`Passive income per second: ${secondIncome}`);
    console.log(`New coin count: ${coins}`);

    localStorage.setItem("coin-count", coins);
    countTxt.textContent = coins;
}, 1000);

document.addEventListener('DOMContentLoaded', function() {
    // Конфигурация Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyDzwDUN9-X9B4uTxomjJAz4oNIREEVXYqo",
        authDomain: "shovel-coin.firebaseapp.com",
        projectId: "shovel-coin",
        storageBucket: "shovel-coin.appspot.com",
        messagingSenderId: "485128858471",
        appId: "1:485128858471:web:601e1787a95ec9bdea5dc2",
        measurementId: "G-77Z9QR30EK"
    };

    // Инициализируем Firebase
    firebase.initializeApp(firebaseConfig);

    // Получаем ссылку на Firestore
    const db = firebase.firestore();

    // Получаем Telegram ID пользователя
    const tgId = window.Telegram.WebApp.initDataUnsafe.user.id;
    document.getElementById('tgId').textContent = tgId;

    // Функция для загрузки данных пользователя
    function loadUserData() {
        db.collection('players').doc(tgId.toString()).get().then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                Object.keys(data).forEach(key => {
                    localStorage.setItem(key, data[key]);
                });
                updateDisplay();
            } else {
                // Если данных нет в Firebase, используем локальные данные
                saveUserData();
            }
        }).catch((error) => {
            console.error("Ошибка при загрузке данных пользователя:", error);
        });
    }

    // Функция для сохранения данных пользователя
    function saveUserData() {
        const userData = {
            tapIncome: localStorage.getItem("tap-income"),
            maxEnergy: localStorage.getItem("max-energy"),
            coinsForUp: localStorage.getItem("coins-for-up"),
            coinCount: localStorage.getItem("coin-count"),
            hourIncome: localStorage.getItem("hour-income"),
            currentEnergy: localStorage.getItem("current-energy")
        };

        db.collection('players').doc(tgId.toString()).set(userData)
            .then(() => console.log("Данные пользователя сохранены"))
            .catch((error) => console.error("Ошибка при сохранении данных пользователя:", error));
    }

    // Функция для обновления отображения на странице
    function updateDisplay() {
        currentEnergyTxt.textContent = localStorage.getItem("current-energy");
        countTxt.textContent = localStorage.getItem("coin-count");
        tapIncomeTxt.textContent = localStorage.getItem("tap-income");
        coinsForUpTxt.textContent = localStorage.getItem("coins-for-up");
        hourIncomeTxt.textContent = localStorage.getItem("hour-income");
        maxEnergyTxt.textContent = localStorage.getItem("max-energy");
    }

    // Обработчик для кнопки таблицы лидеров
    document.getElementById('leaderboardButton').addEventListener('click', function() {
        window.location.href = 'leaderboard.html';
    });

    // Загружаем данные пользователя при запуске
    loadUserData();

    // Модифицируем функцию upgrade
    function upgrade() {
        let count = +localStorage.getItem("coin-count");
        if (count >= coinsForUpgrade) {
            count -= coinsForUpgrade;
            coinsForUpgrade += 10000;

            let passiveIncome = +localStorage.getItem("hour-income");
            passiveIncome += 3600;

            maxEnergy += 1000;

            let tapIncome = +localStorage.getItem("tap-income");
            tapIncome++;

            localStorage.setItem("coins-for-up", coinsForUpgrade);
            localStorage.setItem("hour-income", passiveIncome);
            localStorage.setItem("coin-count", count);
            localStorage.setItem("tap-income", tapIncome);
            localStorage.setItem("max-energy", maxEnergy);

            countTxt.textContent = count;
            tapIncomeTxt.textContent = tapIncome;
            coinsForUpTxt.textContent = coinsForUpgrade;
            hourIncomeTxt.textContent = passiveIncome;
            maxEnergyTxt.textContent = maxEnergy;

            console.log(`Upgrade successful! New hour income: ${passiveIncome}`);

            // Получаем имя игрока из Telegram WebApp
            const playerName = window.Telegram.WebApp.initDataUnsafe.user.username || "Anonymous";
            updatePlayerScore(playerName, count);

            // Сохраняем данные после апгрейда
            saveUserData();
        }
    }

    // Добавляем обработчик события для кнопки апгрейда
    upgradeButton.addEventListener("click", upgrade);

    // Сохраняем данные каждые 30 секунд
    setInterval(saveUserData, 30000);
});

// ... существующий код ...
