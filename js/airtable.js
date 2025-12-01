// Airtable Integration
const AIRTABLE_CONFIG = {
    token: 'YOUR_TOKEN_HERE',
    baseId: 'appakHgEWKsk7IWNK',
    tables: {
        giocatori: 'tblr9VNukwxd6LAuU',
        partite: 'tbl5Kii1jfpoQHxSr',
        allenamenti: 'tbleGoRCEQNGWyh32',
        gol: 'tblkzYPzyZXgUpb6Q'
    }
};

class AirtableService {
    constructor(config) {
        this.config = config;
        this.baseUrl = `https://api.airtable.com/v0/${config.baseId}`;
        this.headers = {
            'Authorization': `Bearer ${config.token}`,
            'Content-Type': 'application/json'
        };
    }

    async fetchTable(tableId) {
        try {
            const response = await fetch(`${this.baseUrl}/${tableId}`, {
                headers: this.headers
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.records;
        } catch (error) {
            console.error(`Error fetching table ${tableId}:`, error);
            return [];
        }
    }

    async fetchAllData() {
        try {
            const [giocatori, partite, allenamenti, gol] = await Promise.all([
                this.fetchTable(this.config.tables.giocatori),
                this.fetchTable(this.config.tables.partite),
                this.fetchTable(this.config.tables.allenamenti),
                this.fetchTable(this.config.tables.gol)
            ]);

            return {
                giocatori: this.parseGiocatori(giocatori, gol),
                partite: this.parsePartite(partite),
                allenamenti: this.parseAllenamenti(allenamenti)
            };
        } catch (error) {
            console.error('Error fetching all data:', error);
            return null;
        }
    }

    parseGiocatori(giocatori, gol) {
        // Count goals per player
        const goalCounts = {};
        const assistCounts = {};
        
        gol.forEach(record => {
            const fields = record.fields;
            
            // Count goals
            if (fields.Giocatore && fields.Giocatore.length > 0) {
                const playerId = fields.Giocatore[0];
                goalCounts[playerId] = (goalCounts[playerId] || 0) + 1;
            }
            
            // Count assists
            if (fields.Assist && fields.Assist.length > 0) {
                const assistId = fields.Assist[0];
                assistCounts[assistId] = (assistCounts[assistId] || 0) + 1;
            }
        });

        return giocatori.map(record => {
            const fields = record.fields;
            return {
                id: record.id,
                firstName: fields.Nome || '',
                lastName: fields.Cognome || '',
                number: fields.Numero || 0,
                position: fields.Ruolo || '',
                goals: goalCounts[record.id] || 0,
                assists: assistCounts[record.id] || 0,
                motm: fields.MOTM || 0,
                photo: fields.Foto?.[0]?.url || null
            };
        });
    }

    parsePartite(partite) {
        return partite.map(record => {
            const fields = record.fields;
            return {
                id: record.id,
                type: 'match',
                title: fields.Avversario ? `TC Caneva vs ${fields.Avversario}` : 'Partita',
                date: fields.Data || '',
                time: fields.Ora || '',
                location: fields.Luogo || '',
                opponent: fields.Avversario || '',
                result: fields.Risultato || null,
                goalsFavor: fields['Goal Fatti'] || 0,
                goalsAgainst: fields['Goal Subiti'] || 0
            };
        });
    }

    parseAllenamenti(allenamenti) {
        return allenamenti.map(record => {
            const fields = record.fields;
            return {
                id: record.id,
                type: 'training',
                title: fields.Titolo || 'Allenamento',
                date: fields.Data || '',
                time: fields.Ora || '',
                location: fields.Luogo || '',
                notes: fields.Note || ''
            };
        });
    }

    async createGiocatore(data) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.config.tables.giocatori}`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    fields: {
                        Nome: data.firstName,
                        Cognome: data.lastName,
                        Numero: data.number,
                        Ruolo: data.position
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error creating player:', error);
            throw error;
        }
    }

    async createPartita(data) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.config.tables.partite}`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    fields: {
                        Data: data.date,
                        Ora: data.time,
                        Avversario: data.opponent,
                        Luogo: data.location
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error creating match:', error);
            throw error;
        }
    }

    async createAllenamento(data) {
        try {
            const response = await fetch(`${this.baseUrl}/${this.config.tables.allenamenti}`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    fields: {
                        Titolo: data.title,
                        Data: data.date,
                        Ora: data.time,
                        Luogo: data.location,
                        Note: data.notes || ''
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error creating training:', error);
            throw error;
        }
    }
}

// Initialize service
const airtableService = new AirtableService(AIRTABLE_CONFIG);
