document.addEventListener('DOMContentLoaded', function() {
    // KONSTANTER
    const DAILY_GOAL_KEY = 'dailyGoal';
    const DEFAULT_GOAL = 2000;

    // Funksjon for å hente lagret mål eller standardverdi
    function getDailyGoalValue() {
        const goal = localStorage.getItem(DAILY_GOAL_KEY);
        return parseInt(goal) || DEFAULT_GOAL;
    }

    // DOM-elementer (GRUNNLEGGENDE)
    const dashboard = document.getElementById('dashboard');
    const kcalInElement = document.getElementById('kcal-in');
    const kcalBurnedElement = document.getElementById('kcal-burned');
    const kcalNetElement = document.getElementById('kcal-net');
    const dailyLogList = document.getElementById('daily-log');
    const mealForm = document.getElementById('meal-form');
    const workoutForm = document.getElementById('workout-form');
    const workoutTypeSelect = document.getElementById('workout-type');
    const manualKcalInputDiv = document.getElementById('manual-kcal-input');
    
    // DOM-elementer (NYTT AI-SØK)
    const showAiSearchButton = document.getElementById('show-ai-search');
    const aiSearchDiv = document.getElementById('meal-ai-search');
    const runAiSearchButton = document.getElementById('run-ai-search');
    const foodSearchTermInput = document.getElementById('food-search-term');
    const aiResultStatus = document.getElementById('ai-result-status');
    const useAiResultButton = document.getElementById('use-ai-result');
    const mealTypeSelect = document.getElementById('meal-type');
    const mealKcalInput = document.getElementById('meal-kcal');
    const mealManualInputDiv = document.getElementById('meal-manual-input');


    // Variabel for å holde det siste AI-resultatet
    let lastAiResult = null; 

    // Funksjon for å bytte visning
    function changeView(targetId) {
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(targetId).classList.add('active');
        
        // Når vi går tilbake til dashboard, nullstiller vi meal-view state
        if (targetId === 'dashboard') {
            // Skjuler AI-søk og viser manuell inntasting igjen
            mealManualInputDiv.style.display = 'block';
            aiSearchDiv.style.display = 'none';
            aiResultStatus.textContent = '';
            useAiResultButton.style.display = 'none';
            lastAiResult = null;
            mealForm.reset();
        }
    }

    // FUNKSJON: Sett dagsmålet
    function setDailyGoal() {
        let currentGoal = getDailyGoalValue();
        const newGoal = prompt(`Angi ditt nye daglige kaloriforbruksmål (i Kcal). Nåværende: ${currentGoal}`, currentGoal);
        
        if (newGoal === null) return;
        
        const goalValue = parseInt(newGoal);
        
        if (goalValue > 500 && goalValue < 10000) {
            localStorage.setItem(DAILY_GOAL_KEY, goalValue);
            updateDashboard();
        } else {
            alert("Vennligst oppgi et realistisk mål mellom 500 og 10000 Kcal.");
        }
    }
    
    // --- NY FUNKSJON: Simuler AI/API-søk ---
    function simulateAISearch(query) {
        const lowerQuery = query.toLowerCase();

        // Simulerte resultater
        if (lowerQuery.includes('havregryn') && lowerQuery.includes('100g')) return { kcal: 370, description: '100g Havregryn' };
        if (lowerQuery.includes('kylling') && lowerQuery.includes('150g')) return { kcal: 240, description: '150g stekt kyllingfilet' };
        if (lowerQuery.includes('brød') || lowerQuery.includes('skive')) return { kcal: 180, description: '2 skiver grovbrød' };
        if (lowerQuery.includes('eple')) return { kcal: 95, description: '1 Eple (medium)' };
        if (lowerQuery.includes('cola')) return { kcal: 139, description: '1 boks Cola' };
        
        // Generisk resultat
        const genericKcal = Math.max(100, Math.min(1000, query.length * 30 + 100)); // Gir en varierende, men realistisk kcal basert på lengde
        return { kcal: genericKcal, description: query };
    }


    // Event listeners for navigasjon
    document.getElementById('show-add-meal').addEventListener('click', () => changeView('add-meal'));
    document.getElementById('show-add-workout').addEventListener('click', () => changeView('add-workout'));
    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('click', (e) => changeView(e.target.dataset.target));
    });
    document.getElementById('set-goal-link').addEventListener('click', function(e) {
        e.preventDefault();
        setDailyGoal();
    });


    // --- AI/SØK EVENT LISTENERS ---

    // Viser/skjuler AI-søk seksjonen
    showAiSearchButton.addEventListener('click', function() {
        const isAiVisible = aiSearchDiv.style.display === 'block';
        
        if (!isAiVisible) {
            // Skjuler manuell inntasting, viser AI-søk
            mealManualInputDiv.style.display = 'none';
            aiSearchDiv.style.display = 'block';
            showAiSearchButton.textContent = 'Tilbake til Manuell Inntasting ✍️';
        } else {
            // Skjuler AI-søk, viser manuell inntasting
            mealManualInputDiv.style.display = 'block';
            aiSearchDiv.style.display = 'none';
            showAiSearchButton.textContent = 'Søk etter Kcal (AI) 🔍';
            
            // Nullstill AI-status
            aiResultStatus.textContent = '';
            useAiResultButton.style.display = 'none';
            foodSearchTermInput.value = '';
            lastAiResult = null;
        }
    });

    // Kjører AI-søk
    runAiSearchButton.addEventListener('click', function() {
        const query = foodSearchTermInput.value.trim();
        if (query.length < 3) {
            aiResultStatus.textContent = 'Vennligst skriv inn minst 3 tegn.';
            useAiResultButton.style.display = 'none';
            return;
        }

        aiResultStatus.textContent = 'Søker...';
        useAiResultButton.style.display = 'none';

        // Simulerer forsinkelse for å etterligne API-kall (800ms)
        setTimeout(() => {
            lastAiResult = simulateAISearch(query);

            if (lastAiResult) {
                // Oppdaterer status med funnet resultat
                aiResultStatus.innerHTML = `Funnet! **${lastAiResult.description.substring(0, 30)}...** ≈ **${lastAiResult.kcal} Kcal**`;
                useAiResultButton.style.display = 'block';
            } else {
                aiResultStatus.textContent = 'Fant ingen spesifikke treff. Prøv igjen.';
            }
        }, 800); 
    });

    // Bruker AI-resultatet til å loggføre
    useAiResultButton.addEventListener('click', function() {
        if (lastAiResult) {
            // Oppretter en dummy-entry for å loggføre AI-resultatet
            const entry = {
                type: 'meal',
                description: lastAiResult.description,
                kcal: lastAiResult.kcal,
                time: new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })
            };
            saveLogEntry(entry);
            
            // Går tilbake til manuell inntasting og dashboard
            mealManualInputDiv.style.display = 'block';
            aiSearchDiv.style.display = 'none';
            showAiSearchButton.textContent = 'Søk etter Kcal (AI) 🔍';
            aiResultStatus.textContent = '';
            useAiResultButton.style.display = 'none';
            foodSearchTermInput.value = '';
            lastAiResult = null;
        }
    });
    // --- SLUTT AI/SØK EVENT LISTENERS ---


    // Funksjon for å laste ALL loggdata fra localStorage
    function getAllLogData() {
        return JSON.parse(localStorage.getItem('dailyLog')) || {};
    }

    // Beregner startdatoen for inneværende uke (Mandag)
    function getStartOfWeek() {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Søndag, 1 = Mandag, osv.
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
        const startOfWeek = new Date(now.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0); 
        return startOfWeek;
    }

    // Henter loggføringer kun for inneværende uke
    function getWeekLog() {
        const allLog = getAllLogData();
        const startOfWeek = getStartOfWeek().getTime();
        const weekLog = [];
        const uniqueDaysLoggedThisWeek = new Set(); 

        for (const dateString in allLog) {
            const date = new Date(dateString);

            if (date.getTime() >= startOfWeek) {
                weekLog.push(...allLog[dateString]);
                uniqueDaysLoggedThisWeek.add(dateString);
            }
        }
        
        return { log: weekLog, days: uniqueDaysLoggedThisWeek.size };
    }

    // Henter kun dagens logg
    function getDailyLog() {
        const today = new Date().toDateString();
        return getAllLogData()[today] || []; 
    }

    // Funksjon for å lagre data til localStorage
    function saveLogEntry(entry) {
        const today = new Date().toDateString();
        const log = getAllLogData();
        
        if (!log[today]) {
            log[today] = [];
        }
        
        log[today].push(entry);
        localStorage.setItem('dailyLog', JSON.stringify(log));
        updateDashboard();
        changeView('dashboard');
    }

    // Funksjon for å oppdatere dashboard (beregninger og visning)
    function updateDashboard() {
        const dailyLog = getDailyLog();
        const { log: weeklyLog, days: daysInWeekLogged } = getWeekLog();
        
        const dailyGoal = getDailyGoalValue();
        
        // Daglige base = Mål
        let dailyKcalBurned = dailyGoal; 
        let dailyKcalIn = 0;
        
        // Ukentlig base = Mål * antall dager med loggføring (hver dag teller mot målet)
        let weeklyKcalBurned = daysInWeekLogged * dailyGoal;
        let weeklyKcalIn = 0;
        
        dailyLogList.innerHTML = '';

        // 1. Beregn Daglige Totaler og vis detaljert logg
        dailyLog.forEach(entry => {
            if (entry.type === 'meal') {
                dailyKcalIn += entry.kcal;
                dailyLogList.innerHTML += `<li>${entry.time} | 🍽️ ${entry.description} <span>+${entry.kcal} Kcal</span></li>`;
            } else if (entry.type === 'workout') {
                dailyKcalBurned += entry.kcal; 
                dailyLogList.innerHTML += `<li>${entry.time} | 💪 ${entry.description} <span>-${entry.kcal} Kcal</span></li>`;
            }
        });

        // 2. Beregn Ukentlige Totaler
        weeklyLog.forEach(entry => {
            if (entry.type === 'meal') {
                weeklyKcalIn += entry.kcal;
            } else if (entry.type === 'workout') {
                weeklyKcalBurned += entry.kcal;
            }
        });

        // Vis daglige data
        const totalNet = dailyKcalIn - dailyKcalBurned;
        
        document.getElementById('daily-goal-value').textContent = dailyGoal;
        
        kcalInElement.textContent = dailyKcalIn;
        kcalBurnedElement.textContent = dailyKcalBurned;
        kcalNetElement.textContent = totalNet;
        
        kcalNetElement.style.color = totalNet > 0 ? '#F44336' : (totalNet < 0 ? '#4CAF50' : '#0d47a1');

        // Vis ukentlige data
        document.getElementById('week-in').textContent = `Inntatt: ${weeklyKcalIn} Kcal`;
        document.getElementById('week-burned').textContent = `Forbrukt: ${weeklyKcalBurned} Kcal`;
    }

    // Håndter skjemaer
    mealForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Bruker data fra de manuelle feltene
        const kcal = parseInt(mealKcalInput.value);
        const type = mealTypeSelect.value;
        
        // Hvis AI-søk er aktivt, vil loggføringen skje via 'use-ai-result' knappen, men vi sikrer at vi logger dersom submit trykkes manuelt.
        if (kcal && type) {
            const entry = {
                type: 'meal',
                description: type,
                kcal: kcal,
                time: new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })
            };
            saveLogEntry(entry);
            mealForm.reset();
        }
    });

    workoutForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const selectedOption = workoutTypeSelect.value;
        let kcal = 0;
        let description = '';

        if (selectedOption === 'manual') {
            kcal = parseInt(document.getElementById('workout-kcal').value);
            description = 'Manuell Trening';
        } else {
            kcal = parseInt(selectedOption);
            description = workoutTypeSelect.options[workoutTypeSelect.selectedIndex].text.split('(')[0].trim();
        }
        
        if (kcal > 0) {
            const entry = {
                type: 'workout',
                description: description,
                kcal: kcal,
                time: new Date().toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })
            };
            saveLogEntry(entry);
            workoutForm.reset();
            manualKcalInputDiv.style.display = 'none'; 
        }
    });

    workoutTypeSelect.addEventListener('change', function() {
        if (this.value === 'manual') {
            manualKcalInputDiv.style.display = 'block';
            document.getElementById('workout-kcal').setAttribute('required', 'required');
        } else {
            manualKcalInputDiv.style.display = 'none';
            document.getElementById('workout-kcal').removeAttribute('required');
        }
    });
    
    // Håndter Tøm Logg-knappen
    document.getElementById('reset-button').addEventListener('click', function() {
        if (confirm("Er du sikker på at du vil tømme loggen for i dag?")) {
            const today = new Date().toDateString();
            const log = getAllLogData();
            
            delete log[today]; 
            localStorage.setItem('dailyLog', JSON.stringify(log));
            updateDashboard();
        }
    });

    // Initial lasting av data
    updateDashboard();
});
