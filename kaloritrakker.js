document.addEventListener('DOMContentLoaded', function() {
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

    // Funksjon for å bytte visning
    function changeView(targetId) {
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(targetId).classList.add('active');
    }

    // Event listeners for navigasjon
    document.getElementById('show-add-meal').addEventListener('click', () => changeView('add-meal'));
    document.getElementById('show-add-workout').addEventListener('click', () => changeView('add-workout'));
    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('click', (e) => changeView(e.target.dataset.target));
    });

    // Funksjon for å laste data fra localStorage
    function getDailyLog() {
        const today = new Date().toDateString();
        const log = JSON.parse(localStorage.getItem('dailyLog')) || {};
        
        // Hent dagens logg, eller en tom liste hvis dagen ikke finnes
        return log[today] || []; 
    }

    // Funksjon for å lagre data til localStorage
    function saveLogEntry(entry) {
        const today = new Date().toDateString();
        const log = JSON.parse(localStorage.getItem('dailyLog')) || {};
        
        // Sjekk om dagens logg eksisterer
        if (!log[today]) {
            log[today] = [];
        }
        
        log[today].push(entry);
        localStorage.setItem('dailyLog', JSON.stringify(log));
        updateDashboard();
        changeView('dashboard'); // Tilbake til hovedskjermen
    }

    // Funksjon for å oppdatere dashboard (beregninger og visning)
    function updateDashboard() {
        const log = getDailyLog();
        let totalKcalIn = 0;
        let totalKcalBurned = 0;
        
        // Tøm logglisten
        dailyLogList.innerHTML = '';

        log.forEach(entry => {
            // Beregn totaler
            if (entry.type === 'meal') {
                totalKcalIn += entry.kcal;
                dailyLogList.innerHTML += `<li>${entry.time} | 🍽️ ${entry.description} <span>+${entry.kcal} Kcal</span></li>`;
            } else if (entry.type === 'workout') {
                totalKcalBurned += entry.kcal;
                dailyLogList.innerHTML += `<li>${entry.time} | 💪 ${entry.description} <span>-${entry.kcal} Kcal</span></li>`;
            }
        });

        // Beregn og vis netto
        const totalNet = totalKcalIn - totalKcalBurned;
        
        kcalInElement.textContent = totalKcalIn;
        kcalBurnedElement.textContent = totalKcalBurned;
        kcalNetElement.textContent = totalNet;

        // Fargekod netto Kcal (valgfritt)
        kcalNetElement.style.color = totalNet > 0 ? '#F44336' : (totalNet < 0 ? '#4CAF50' : '#0d47a1');
    }

    // Håndter skjema for måltid
    mealForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
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

    // Håndter skjema for trening
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
            manualKcalInputDiv.style.display = 'none'; // Skjul manuelt felt etter lagring
        }
    });

    // Vis/skjul manuelt kcal-felt for trening
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
            const log = JSON.parse(localStorage.getItem('dailyLog')) || {};
            
            // Fjerner kun dagens logg, ikke hele historikken i log-objektet
            delete log[today]; 
            localStorage.setItem('dailyLog', JSON.stringify(log));
            updateDashboard();
        }
    });

    // Initial lasting av data
    updateDashboard();
});