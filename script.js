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
            throw new Error('Failed to initialize user data');
        }

        updateDisplay();

        setInterval(async function refillEnergy() {
            if (!userData) return;
            const energyRegenRate = 1 + (userData.upgrade_levels?.energyRegen || 0) * upgrades.energyRegen.effect;
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
        showNotification('Ошибка инициализации приложения. Пожалуйста, попробуйте позже.');
    }
}
