import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Конфигурация Supabase
const supabaseUrl = 'https://tqthmgwbohenijykixzb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxdGhtZ3dib2hlbmlqeWtpeHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk5NjcwMDIsImV4cCI6MjA0NTU0MzAwMn0.QNo46wvV64TCvILyvPRocMKAQjVH9QyZYmXo1SZAcWU'
const supabase = createClient(supabaseUrl, supabaseKey)

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
    userId = tg.initDataUnsafe.user.id.toString(); // Преобразуем в строку
    userName = tg.initDataUnsafe.user.first_name;

    // Загружаем данные пользователя из Supabase
    loadUserData();

    clickButton.addEventListener('click', () => {
        coinCount++;
        coinCountElement.textContent = coinCount;
        // Сохраняем данные при каждом клике
        saveUserData();
    });

    async function updateLeaderboard() {
        const { data, error } = await supabase
            .from('users')
            .select()
            .order('score', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error loading leaderboard:', error);
            return;
        }

        leaderboard = data.map(user => ({
            ...user,
            score: Number(user.score)
        }));

        leaderboardList.innerHTML = '';
        leaderboard.forEach((user, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${user.name}: ${user.score}`;
            leaderboardList.appendChild(li);
        });
    }

    async function saveUserData() {
        const { data, error } = await supabase
            .from('users')
            .upsert({ id: userId, name: userName, score: coinCount }, { onConflict: 'id' })
        
        if (error) {
            console.error('Error saving user data:', error);
        } else {
            updateLeaderboard();
        }
    }

    async function loadUserData() {
        const { data, error } = await supabase
            .from('users')
            .select()
            .eq('id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Пользователь не найден, создаем новую запись
                coinCount = 0;
                await saveUserData();
            } else {
                console.error('Error loading user data:', error);
            }
        } else if (data) {
            coinCount = Number(data.score);
            coinCountElement.textContent = coinCount;
        }

        updateLeaderboard();
    }
});
