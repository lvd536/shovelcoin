async function initApp() {
    debugLog('Initializing app...');
    
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        debugLog('Telegram WebApp is ready');
    } else {
        debugLog('Telegram WebApp is not available');
        showNotification('Ошибка: WebApp не доступен');
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

        debugLog('App initialized successfully');
    } catch (error) {
        debugLog('Error during app initialization: ' + error.message);
        showNotification('Ошибка инициализации приложения. Пожалуйста, попробуйте позже.');
    }
}

async function getOrCreateUser() {
    const telegramId = getTelegramId();
    if (!telegramId) {
        debugLog('Failed to get Telegram ID');
        return null;
    }

    try {
        // Попытка получить существующего пользователя
        let { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', telegramId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Пользователь не найден, создаем нового
                const newUser = {
                    id: telegramId,
                    name: 'New Player',
                    score: 1000,
                    tap_income: 1,
                    max_energy: 1000,
                    coins_for_up: 1000,
                    hour_income: 3600,
                    current_energy: 1000,
                    total_earned: 0,
                    rank: 0,
                    upgrade_levels: {
                        passiveIncome: 0,
                        clickPower: 0,
                        maxEnergy: 0,
                        energyRegen: 0
                    }
                };

                const { data: createdUser, error: createError } = await supabase
                    .from('users')
                    .insert([newUser])
                    .single();

                if (createError) {
                    throw createError;
                }

                debugLog('New user created: ' + JSON.stringify(createdUser));
                return createdUser;
            } else {
                throw error;
            }
        }

        debugLog('Existing user found: ' + JSON.stringify(data));
        return data;
    } catch (error) {
        debugLog('Error in getOrCreateUser: ' + error.message);
        return null;
    }
}
