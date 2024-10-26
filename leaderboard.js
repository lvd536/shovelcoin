// Конфигурация Firebase (такая же, как в script.js)
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

// Функция для получения и отображения топ-10 игроков
function displayLeaderboard() {
    db.collection('players').orderBy('coinCount', 'desc').limit(10).get().then((snapshot) => {
        const leaderboardBody = document.getElementById('leaderboardBody');
        leaderboardBody.innerHTML = '';
        
        snapshot.docs.forEach((doc, index) => {
            const player = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>Player ${doc.id.slice(-4)}</td>
                <td>${player.coinCount}</td>
            `;
            leaderboardBody.appendChild(row);
        });

        // Сохраняем топ-10 в localStorage
        localStorage.setItem('leaderboard', JSON.stringify(snapshot.docs.map(doc => ({
            id: doc.id,
            coinCount: doc.data().coinCount
        }))));
    }).catch((error) => {
        console.error("Ошибка при получении данных таблицы лидеров:", error);
        
        // Если есть ошибка, пытаемся загрузить данные из localStorage
        const localLeaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
        const leaderboardBody = document.getElementById('leaderboardBody');
        leaderboardBody.innerHTML = '';
        
        localLeaderboard.forEach((player, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>Player ${player.id.slice(-4)}</td>
                <td>${player.coinCount}</td>
            `;
            leaderboardBody.appendChild(row);
        });
    });
}

// Вызываем функцию при загрузке страницы
document.addEventListener('DOMContentLoaded', displayLeaderboard);
