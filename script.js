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

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
let currentUser = null;

// ... остальные объявления переменных остаются без изменений ...

// Функция для аутентификации пользователя
function authenticateUser() {
    firebase.auth().signInAnonymously()
        .then((userCredential) => {
            currentUser = userCredential.user;
            loadUserData();
        })
        .catch((error) => {
            console.error("Ошибка аутентификации:", error);
        });
}

// Функция для загрузки данных пользователя
function loadUserData() {
    db.collection('users').doc(currentUser.uid).get()
        .then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                updateUI(data);
            } else {
                initializeUserData();
            }
        })
        .catch((error) => {
            console.error("Ошибка при загрузке данных:", error);
        });
}

// Функция для инициализации данных нового пользователя
function initializeUserData() {
    const initialData = {
        tapIncome: 1,
        maxEnergy: 1000,
        coinsForUp: 1000,
        coinCount: 0,
        hourIncome: 3600,
        currentEnergy: 1000
    };
    
    db.collection('users').doc(currentUser.uid).set(initialData)
        .then(() => {
            updateUI(initialData);
        })
        .catch((error) => {
            console.error("Ошибка при инициализации данных:", error);
        });
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
function updateFirebase(updates) {
    db.collection('users').doc(currentUser.uid).update(updates)
        .catch((error) => {
            console.error("Ошибка при обновлении данных:", error);
        });
}

// Обновляем функцию refillEnergy
setInterval(function refillEnergy() {
    db.collection('users').doc(currentUser.uid).get()
        .then((doc) => {
            const data = doc.data();
            let currentEnergy = data.currentEnergy;
            const maxEnergy = data.maxEnergy;
            
            if (currentEnergy <= maxEnergy - 3) {
                currentEnergy += 3;
            } else {
                currentEnergy = maxEnergy;
            }
            
            updateFirebase({ currentEnergy: currentEnergy });
            currentEnergyTxt.textContent = currentEnergy;
        });
}, 3000);

// Обновляем обработчик клика по кнопке
button.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();

    db.collection('users').doc(currentUser.uid).get()
        .then((doc) => {
            const data = doc.data();
            let currentEnergy = data.currentEnergy;
            const tapIncome = data.tapIncome;
            let coinCount = data.coinCount;

            if (currentEnergy >= tapIncome) {
                currentEnergy -= tapIncome;
                coinCount += tapIncome;

                updateFirebase({
                    currentEnergy: currentEnergy,
                    coinCount: coinCount
                });

                currentEnergyTxt.textContent = currentEnergy;
                countTxt.textContent = coinCount;
            }
        });
});

// Обновляем функцию upgrade
function upgrade() {
    db.collection('users').doc(currentUser.uid).get()
        .then((doc) => {
            const data = doc.data();
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
                
                updateFirebase(updates);
                updateUI({ ...data, ...updates });
                
                console.log(`Upgrade successful! New hour income: ${updates.hourIncome}`);
            } else {
                console.log("Not enough coins for upgrade.");
            }
        });
}

// Обновляем функцию farmMoney
setInterval(function farmMoney() {
    db.collection('users').doc(currentUser.uid).get()
        .then((doc) => {
            const data = doc.data();
            let hourIncome = data.hourIncome;
            let coins = data.coinCount;

            let secondIncome = Math.round(hourIncome / 3600);
            coins += secondIncome;

            console.log(`Passive income per second: ${secondIncome}`);
            console.log(`New coin count: ${coins}`);

            updateFirebase({ coinCount: coins });
            countTxt.textContent = coins;
        });
}, 1000);

// Запускаем аутентификацию при загрузке страницы
authenticateUser();

// ... остальной код остается без изменений ...
