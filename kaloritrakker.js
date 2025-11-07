document.addEventListener('DOMContentLoaded', function() {
    // KONSTANTER
    const DAILY_GOAL_KEY = 'dailyGoal';
    const DEFAULT_GOAL = 2000;

    // Funksjon for å hente lagret mål eller standardverdi
    function getDailyGoalValue() {
        const goal = localStorage.getItem(DAILY_GOAL_KEY);
        // Returnerer lagret verdi (konvertert til tall) eller standardverdi (2000)
        return parseInt(goal) || DEFAULT_GOAL;
    }

    // DOM-elementer
    const dashboard = document.getElementById('dashboard');
    const addMealView = document.getElementById('add-meal');
    const addWorkoutView = document.getElementById('add-workout');
    const kcalInElement = document.getElementById('kcal-in');
    const kcalBurnedElement = document.getElementById('kcal-burned');
    const kcalNetElement = document.getElementById('kcal-net');
    const dailyLogList = document.getElementById('daily-log');
    const mealForm = document.getElementById('meal-form');
    const workoutForm = document.getElementById('workout-form');
    const workoutTypeSelect = document.getElementById('workout-type');
    const manualKcalInputDiv = document.getElementById('manual-kcal-input');

    // NYE ELEMENTER FOR UKESTATISTIKK
    const weeklySummaryDiv = document.createElement('div');
    weeklySummaryDiv.id = 'weekly-summary';
    weeklySummaryDiv.innerHTML = '<h3>Ukentlig Oppsummering (Man – I dag)</h3><p id="week-in">Inntatt: 0 Kcal</p><p id="week-burned">Forbrukt: 0 Kcal</p>';
    dashboard.insertBefore(weeklySummaryDiv, document.getElementById('show-add-meal'));
    // SLUTT NYE ELEMENTER

    // NYTT ELEMENT FOR DAGSMÅL og SETT MÅL-KNAPP
    const dailyGoalDiv = document.createElement('div');
    dailyGoalDiv.id = 'daily-goal-container';
    dailyGoalDiv.innerHTML = '<p>Dagens Mål: <span id="daily-goal-value"></span> Kcal</p><a href="#" id="set-goal-link">Sett Mål</a>';
    // Sett inn under weekly summary
    dashboard.insertBefore(dailyGoalDiv, weeklySummaryDiv.nextSibling);

    // Funksjon for å bytte visning
    function changeView(targetId) {
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(targetId).classList.add('active');
    }

    // NY FUNKSJON: Sett dagsmålet
    function setDailyGoal() {
        let currentGoal = getDailyGoalValue();
        const newGoal = prompt(`Angi ditt nye daglige kaloriforbruksmål (i Kcal). Nåværende: ${currentGoal}`, currentGoal);
        
        if (newGoal === null) return; // Bruker trykket Avbryt
        
        const goalValue = parseInt(newGoal);
        
        if (goalValue > 500 && goalValue < 10000) {
            localStorage.setItem(DAILY_GOAL_KEY, goalValue);
            updateDashboard();
        } else {
            alert("Vennligst oppgi et realistisk mål mellom 500 og 10000 Kcal.");
        }
    }

    // Event listeners for navigasjon
    document.getElementById('show-add-meal').addEventListener('click', () => changeView('add-meal'));
    document.getElementById('show-add-workout').addEventListener('click', () => changeView('add-workout'));
    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('click', (e) => changeView(e.target.dataset.target));
    });
    // Event listener for Sett Mål
    document.getElementById('set-goal-link').addEventListener('click', function(e) {
        e.preventDefault();
        setDailyGoal();
    });

    // Funksjon for å laste ALL loggdata fra localStorage
    function getAllLogData() {
        return JSON.parse(localStorage.getItem('dailyLog')) || {};
    }

    // Beregner startdatoen for inneværende uke (Mandag)
    function getStartOfWeek() {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Søndag, 1 = Mandag, osv.
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Justerer til Mandag
        const startOfWeek = new Date(now.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0); // Setter klokken til midnatt
        return startOfWeek;
    }

    // Henter loggføringer kun for inneværende uke
    function getWeekLog() {
        const allLog = getAllLogData();
        const startOfWeek = getStartOfWeek().getTime();
        const weekLog = [];
        const uniqueDaysLoggedThisWeek = new Set(); // For å telle unike dager

        // Iterer gjennom hver dag i lagringsloggen
        for (const dateString in allLog) {
            const date = new Date(dateString);

            // Sjekk om datoen er i inneværende uke (etter eller lik Mandag)
            if (date.getTime() >= startOfWeek) {
                weekLog.push(...allLog[dateString]);
                uniqueDaysLoggedThisWeek.add(dateString);
            }
        }
        
        // Returnerer loggen og antallet unike dager for ukentlig baseline-beregning
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
        
        // HENTER NÅ MÅLET DYNAMISK
        const dailyGoal = getDailyGoalValue();
        // Setter daglig forbrenning til det nye målet
        let dailyKcalBurned = dailyGoal; 
        // Ukentlig base = Mål * antall dager med loggføring
        let weeklyKcalBurned = daysInWeekLogged * dailyGoal;
        
        let dailyKcalIn = 0;
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
        
        // VISER NÅ MÅLET PÅ DASHBORDET
        document.getElementById('daily-goal-value').textContent = dailyGoal;
        
        kcalInElement.textContent = dailyKcalIn;
        kcalBurnedElement.textContent = dailyKcalBurned;
        kcalNetElement.textContent = totalNet;
        kcalNetElement.style.color = totalNet > 0 ? '#F44336' : (totalNet < 0 ? '#4CAF50' : '#0d47a1');

        // Vis ukentlige data
        document.getElementById('week-in').textContent = `Inntatt: ${weeklyKcalIn} Kcal`;
        document.getElementById('week-burned').textContent = `Forbrukt: ${weeklyKcalBurned} Kcal`;
    }

    // Håndter skjemaer (samme som før, men uten BASE_CALORIE_BURN_DAILY)
    mealForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // ... (Koden for mealForm er uendret)
        
        const kcal = parseInt(document.getElementById('meal-kcal').value);
        const type = document.getElementById('meal-type').value;
        
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
        // ... (Koden for workoutForm er uendret)
        
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
