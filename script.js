import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref, set, onValue, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-analytics.js";

// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDzwDUN9-X9B4uTxomjJAz4oNIREEVXYqo",
    authDomain: "shovel-coin.firebaseapp.com",
    databaseURL: "https://shovel-coin-default-rtdb.firebaseio.com",
    projectId: "shovel-coin",
    storageBucket: "shovel-coin.appspot.com",
    messagingSenderId: "485128858471",
    appId: "1:485128858471:web:601e1787a95ec9bdea5dc2",
    measurementId: "G-77Z9QR30EK"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

let tg = window.Telegram.WebApp;
let coinCount = 0;
let leaderboard = [];
let userId, userName;

document.addEventListener('DOMContentLoaded', () => {
    const clickButton = document.getElementById('clickButton');
    const coinCountElement = document.getElementById('coinCount');
    const leaderboardList = document.getElementById('leaderboardList');

    tg.expand();

    // Получаем данные пользователя
    userId = tg.initDataUnsafe.user.id;
    userName = tg.initDataUnsafe.user.first_name;

    // Загружаем данные пользователя из Firebase
    loadUserData();

    clickButton.addEventListener('click', () => {
        coinCount++;
        coinCountElement.textContent = coinCount;
        updateLeaderboard();
    });

    function updateLeaderboard() {
        leaderboard.sort((a, b) => b.score - a.score);

        leaderboardList.innerHTML = '';
        leaderboard.slice(0, 10).forEach((user, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${user.name}: ${user.score}`;
            leaderboardList.appendChild(li);
        });

        // Отправка данных на сервер
        sendLeaderboardData();
    }

    function sendLeaderboardData() {
        set(ref(database, 'leaderboard/' + userId), {
            name: userName,
            score: coinCount
        });
    }

    function loadUserData() {
        const userRef = ref(database, 'leaderboard/' + userId);
        onValue(userRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                coinCount = data.score;
                coinCountElement.textContent = coinCount;
            }
            loadLeaderboard();
        });
    }

    function loadLeaderboard() {
        const leaderboardRef = query(ref(database, 'leaderboard'), orderByChild('score'), limitToLast(10));
        onValue(leaderboardRef, (snapshot) => {
            const data = snapshot.val();
            leaderboard = [];
            for (let id in data) {
                leaderboard.push({
                    id: id,
                    name: data[id].name,
                    score: data[id].score
                });
            }
            updateLeaderboard();
        });
    }
});
