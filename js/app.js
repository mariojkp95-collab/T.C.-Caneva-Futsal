// App State
const app = {
    data: {
        players: [],
        events: [],
        stats: {
            goals: [],
            assists: [],
            motm: [],
            potw: [],
            potm: []
        }
    },

    init() {
        this.loadData();
        this.setupNavigation();
        this.setupEventListeners();
        this.render();
    },

    // Load data from data.js
    loadData() {
        if (typeof TEAM_DATA !== 'undefined') {
            this.data.players = TEAM_DATA.players;
            this.data.events = TEAM_DATA.events;
            console.log(`✓ Caricati ${this.data.players.length} giocatori`);
            console.log(`✓ Caricati ${this.data.events.length} eventi`);
        } else {
            console.warn('TEAM_DATA non trovato, uso dati demo');
            this.loadDemoData();
        }
    },

    loadDemoData() {
        this.data.players = [
            {
                id: 1,
                firstName: 'Mario',
                lastName: 'Rossi',
                number: 10,
                position: 'Attaccante',
                goals: 15,
                assists: 8,
                motm: 3
            }
        ];
        this.data.events = [];
    },

    // Save data to localStorage
    saveData() {
        localStorage.setItem('tcCanevaData', JSON.stringify(this.data));
    },

    // Navigation
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.navigateTo(page);
            });
        });
    },

    navigateTo(page) {
        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });

        // Update pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.toggle('active', p.id === page);
        });

        // Render page content
        this.renderPage(page);
    },

    // Event Listeners
    setupEventListeners() {
        // Add Player Form
        document.getElementById('addPlayerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addPlayer(new FormData(e.target));
            e.target.reset();
            this.closeModal('addPlayerModal');
        });

        // Add Event Form
        document.getElementById('addEventForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addEvent(new FormData(e.target));
            e.target.reset();
            this.closeModal('addEventModal');
        });

        // Calendar Filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterEvents(e.target.dataset.filter);
            });
        });

        // Stats Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.renderStatsTab(e.target.dataset.tab);
            });
        });
    },

    // Render
    render() {
        this.renderDashboard();
        this.renderPlayers();
        this.renderCalendar();
        this.renderStats();
    },

    renderPage(page) {
        switch(page) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'players':
                this.renderPlayers();
                break;
            case 'calendar':
                this.renderCalendar();
                break;
            case 'stats':
                this.renderStats();
                break;
        }
    },

    renderDashboard() {
        // Update stats
        document.getElementById('totalPlayers').textContent = this.data.players.length;
        
        const upcomingEvents = this.data.events.filter(e => new Date(e.date) >= new Date()).length;
        document.getElementById('upcomingEvents').textContent = upcomingEvents;
        
        const totalGoals = this.data.players.reduce((sum, p) => sum + (p.goals || 0), 0);
        document.getElementById('totalGoals').textContent = totalGoals;
        
        document.getElementById('matchesPlayed').textContent = 
            this.data.events.filter(e => e.type === 'match' && new Date(e.date) < new Date()).length;

        // Render upcoming events
        this.renderUpcomingEvents();
    },

    renderUpcomingEvents() {
        const container = document.getElementById('upcomingEventsList');
        const upcoming = this.data.events
            .filter(e => new Date(e.date) >= new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5);

        if (upcoming.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">Nessun evento in programma</p>';
            return;
        }

        container.innerHTML = upcoming.map(event => {
            const date = new Date(event.date);
            return `
                <div class="event-item">
                    <div class="event-date">
                        <div class="event-day">${date.getDate()}</div>
                        <div class="event-month">${date.toLocaleDateString('it-IT', { month: 'short' })}</div>
                    </div>
                    <div class="event-info">
                        <strong>${event.title}</strong>
                        <small>${event.time} - ${event.location}</small>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderPlayers() {
        const container = document.getElementById('playersList');
        
        if (this.data.players.length === 0) {
            container.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 40px;">Nessun giocatore aggiunto</td></tr>';
            return;
        }

        // Sort by last name
        const sortedPlayers = [...this.data.players].sort((a, b) => 
            a.lastName.localeCompare(b.lastName)
        );

        container.innerHTML = sortedPlayers.map(player => `
            <tr onclick="app.showPlayerDetail('${player.id}')">
                <td><span class="player-number-badge">${player.number}</span></td>
                <td class="player-name-cell">${player.firstName}</td>
                <td class="player-name-cell">${player.lastName}</td>
                <td><span class="player-position-badge">${player.position}</span></td>
                <td><span class="player-stat-number">${player.goals || 0}</span></td>
                <td><span class="player-stat-number">${player.assists || 0}</span></td>
                <td><button class="view-details-btn" onclick="event.stopPropagation(); app.showPlayerDetail('${player.id}')">Dettagli</button></td>
            </tr>
        `).join('');
    },

    showPlayerDetail(playerId) {
        const player = this.data.players.find(p => p.id === playerId);
        if (!player) return;

        document.getElementById('playerDetailName').textContent = `${player.firstName} ${player.lastName}`;
        
        const content = document.getElementById('playerDetailContent');
        content.innerHTML = `
            <div class="player-detail-header">
                <div class="player-detail-number">${player.number || player.jerseyNumber || '?'}</div>
                <div class="player-detail-info">
                    <h2>${player.firstName} ${player.lastName}</h2>
                    <div class="player-detail-position">${player.position || 'Non specificato'}</div>
                </div>
            </div>

            <div class="player-detail-section">
                <h3>Statistiche</h3>
                <ul class="player-detail-list">
                    <li><span class="player-detail-label">Goal</span><span class="player-detail-value">${player.goals || 0}</span></li>
                    <li><span class="player-detail-label">Assist</span><span class="player-detail-value">${player.assists || 0}</span></li>
                    <li><span class="player-detail-label">Contributi Totali</span><span class="player-detail-value">${(player.goals || 0) + (player.assists || 0)}</span></li>
                    <li><span class="player-detail-label">Man of the Match</span><span class="player-detail-value">${player.motm || 0}</span></li>
                </ul>
            </div>

            <div class="player-detail-section">
                <h3>Informazioni Personali</h3>
                <ul class="player-detail-list">
                    ${player.birthDate ? `<li><span class="player-detail-label">Data di Nascita</span><span class="player-detail-value">${player.birthDate}</span></li>` : ''}
                    ${player.birthPlace ? `<li><span class="player-detail-label">Luogo di Nascita</span><span class="player-detail-value">${player.birthPlace}</span></li>` : ''}
                    ${player.gender ? `<li><span class="player-detail-label">Sesso</span><span class="player-detail-value">${player.gender}</span></li>` : ''}
                    ${player.fiscalCode ? `<li><span class="player-detail-label">Codice Fiscale</span><span class="player-detail-value">${player.fiscalCode}</span></li>` : ''}
                    ${player.idCard ? `<li><span class="player-detail-label">Carta d'Identità</span><span class="player-detail-value">${player.idCard}</span></li>` : ''}
                </ul>
            </div>

            ${player.address || player.city ? `
            <div class="player-detail-section">
                <h3>Residenza</h3>
                <ul class="player-detail-list">
                    ${player.address ? `<li><span class="player-detail-label">Indirizzo</span><span class="player-detail-value">${player.address} ${player.streetNumber || ''}</span></li>` : ''}
                    ${player.city ? `<li><span class="player-detail-label">Città</span><span class="player-detail-value">${player.city} ${player.postalCode ? '(' + player.postalCode + ')' : ''}</span></li>` : ''}
                    ${player.province ? `<li><span class="player-detail-label">Provincia</span><span class="player-detail-value">${player.province}</span></li>` : ''}
                </ul>
            </div>
            ` : ''}

            ${player.phone || player.phonePrefix ? `
            <div class="player-detail-section">
                <h3>Contatti</h3>
                <ul class="player-detail-list">
                    ${player.phone ? `<li><span class="player-detail-label">Telefono</span><span class="player-detail-value">${player.phonePrefix || ''} ${player.phone}</span></li>` : ''}
                </ul>
            </div>
            ` : ''}

            <div class="player-detail-section">
                <h3>Equipaggiamento</h3>
                <ul class="player-detail-list">
                    ${player.jerseyNumber ? `<li><span class="player-detail-label">Numero Maglia</span><span class="player-detail-value">${player.jerseyNumber}</span></li>` : ''}
                    ${player.size ? `<li><span class="player-detail-label">Taglia</span><span class="player-detail-value">${player.size}</span></li>` : ''}
                    ${player.kit ? `<li><span class="player-detail-label">Muta</span><span class="player-detail-value">${player.kit}</span></li>` : ''}
                    ${player.bag ? `<li><span class="player-detail-label">Borsa</span><span class="player-detail-value">${player.bag}</span></li>` : ''}
                    ${player.jacket ? `<li><span class="player-detail-label">Felpa/Giubbotto</span><span class="player-detail-value">${player.jacket}</span></li>` : ''}
                    ${player.jerseyTraining ? `<li><span class="player-detail-label">Maglia Allenamento</span><span class="player-detail-value">${player.jerseyTraining}</span></li>` : ''}
                </ul>
            </div>
        `;

        document.getElementById('playerDetailModal').classList.add('active');
    },

    renderCalendar(filter = 'all') {
        const container = document.getElementById('calendarList');
        let events = this.data.events;

        if (filter !== 'all') {
            events = events.filter(e => e.type === filter);
        }

        events.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (events.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">Nessun evento trovato</p>';
            return;
        }

        container.innerHTML = events.map(event => {
            const date = new Date(event.date);
            const isPast = date < new Date();
            
            return `
                <div class="event-card ${event.type}">
                    <div class="event-header">
                        <div>
                            <div class="event-title">${event.title}</div>
                            <span class="event-type">${event.type === 'match' ? 'Partita' : 'Allenamento'}</span>
                        </div>
                    </div>
                    <div class="event-details">
                        <span>${date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span>${event.time}</span>
                        <span>${event.location}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    filterEvents(filter) {
        this.renderCalendar(filter);
    },

    renderStats() {
        this.renderStatsTab('goals');
    },

    renderStatsTab(tab) {
        const container = document.getElementById('statsContent');
        let data = [];

        switch(tab) {
            case 'goals':
                data = [...this.data.players].sort((a, b) => (b.goals || 0) - (a.goals || 0));
                break;
            case 'assists':
                data = [...this.data.players].sort((a, b) => ((b.goals || 0) + (b.assists || 0)) - ((a.goals || 0) + (a.assists || 0)));
                break;
            case 'motm':
                data = [...this.data.players].sort((a, b) => (b.motm || 0) - (a.motm || 0));
                break;
            case 'potw':
            case 'potm':
                container.innerHTML = '<p style="padding: 24px; color: var(--text-secondary); text-align: center;">Funzionalità in arrivo</p>';
                return;
        }

        container.innerHTML = `
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Pos</th>
                        <th>Giocatore</th>
                        <th>Ruolo</th>
                        ${tab === 'goals' ? '<th>Goal</th>' : ''}
                        ${tab === 'assists' ? '<th>Goal</th><th>Assist</th><th>Totale</th>' : ''}
                        ${tab === 'motm' ? '<th>MOTM</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${data.map((player, index) => {
                        let rankClass = '';
                        if (index === 0) rankClass = 'gold';
                        else if (index === 1) rankClass = 'silver';
                        else if (index === 2) rankClass = 'bronze';

                        return `
                            <tr>
                                <td><span class="rank ${rankClass}">${index + 1}</span></td>
                                <td><strong>${player.firstName} ${player.lastName}</strong></td>
                                <td>${player.position}</td>
                                ${tab === 'goals' ? `<td><strong>${player.goals || 0}</strong></td>` : ''}
                                ${tab === 'assists' ? `<td>${player.goals || 0}</td><td>${player.assists || 0}</td><td><strong>${(player.goals || 0) + (player.assists || 0)}</strong></td>` : ''}
                                ${tab === 'motm' ? `<td><strong>${player.motm || 0}</strong></td>` : ''}
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    },

    // Add Player
    addPlayer(formData) {
        const player = {
            id: Date.now(),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            number: parseInt(formData.get('number')),
            position: formData.get('position'),
            goals: 0,
            assists: 0,
            motm: 0
        };

        this.data.players.push(player);
        this.saveData();
        this.render();
    },

    // Add Event
    addEvent(formData) {
        const event = {
            id: Date.now(),
            type: formData.get('type'),
            title: formData.get('title'),
            date: formData.get('date'),
            time: formData.get('time'),
            location: formData.get('location')
        };

        this.data.events.push(event);
        this.saveData();
        this.render();
    },

    // Modal Management
    showAddPlayerModal() {
        document.getElementById('addPlayerModal').classList.add('active');
    },

    showAddEventModal() {
        document.getElementById('addEventModal').classList.add('active');
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});
