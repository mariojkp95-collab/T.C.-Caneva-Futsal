const https = require('https');

const AIRTABLE_CONFIG = {
    token: process.env.AIRTABLE_TOKEN || 'YOUR_TOKEN_HERE',
    baseId: 'appakHgEWKsk7IWNK',
    tables: {
        giocatori: 'tblr9VNukwxd6LAuU',
        partite: 'tbl5Kii1jfpoQHxSr',
        allenamenti: 'tbleGoRCEQNGWyh32',
        gol: 'tblkzYPzyZXgUpb6Q'
    }
};

function fetchTable(tableId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.airtable.com',
            path: `/v0/${AIRTABLE_CONFIG.baseId}/${tableId}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_CONFIG.token}`
            }
        };

        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        }).on('error', reject);
    });
}

async function fetchAllData() {
    try {
        console.log('Scaricando dati da Airtable...\n');

        const [giocatori, partite, allenamenti, gol] = await Promise.all([
            fetchTable(AIRTABLE_CONFIG.tables.giocatori),
            fetchTable(AIRTABLE_CONFIG.tables.partite),
            fetchTable(AIRTABLE_CONFIG.tables.allenamenti),
            fetchTable(AIRTABLE_CONFIG.tables.gol)
        ]);

        console.log('✓ Giocatori:', giocatori.records.length);
        console.log('✓ Partite:', partite.records.length);
        console.log('✓ Allenamenti:', allenamenti.records.length);
        console.log('✓ Gol:', gol.records.length);
        console.log('\n');

        // Count goals per player (considering the Numero field for multiple goals)
        const goalCounts = {};
        const assistCounts = {};
        
        gol.records.forEach(record => {
            const fields = record.fields;
            
            if (fields.Giocatore && fields.Giocatore.length > 0) {
                const playerId = fields.Giocatore[0];
                const numero = fields.Numero || 1; // Number of goals in that match
                goalCounts[playerId] = (goalCounts[playerId] || 0) + numero;
            }
            
            if (fields.Assist && fields.Assist.length > 0) {
                const assistId = fields.Assist[0];
                const numero = fields.Numero || 1; // Number of assists
                assistCounts[assistId] = (assistCounts[assistId] || 0) + numero;
            }
        });

        // Parse players with ALL fields
        const players = giocatori.records.map(record => {
            const fields = record.fields;
            return {
                id: record.id,
                firstName: fields.Nome || '',
                lastName: fields.Cognome || '',
                number: parseInt(fields['n. maglia']) || 0,
                position: fields.Ruolo || '',
                goals: goalCounts[record.id] || 0,
                assists: assistCounts[record.id] || 0,
                motm: fields.MOTM || 0,
                // Additional fields
                gender: fields.Sesso || '',
                birthDate: fields['Data di nascita'] || '',
                birthPlace: fields['Luogo di nascita'] || '',
                address: fields.Indirizzo || '',
                streetNumber: fields['N. Civico'] || '',
                city: fields['Città'] || '',
                province: fields['Prov.'] || '',
                postalCode: fields['C.A.P.'] || '',
                phonePrefix: fields['Pref.'] || '',
                phone: fields.Telefono || '',
                fiscalCode: fields['Codice Fiscale'] || '',
                idCard: fields['Carta d\'identità'] || '',
                kit: fields.Muta || '',
                bag: fields.Borsa || '',
                jacket: fields['Felpa/Giubbotto'] || '',
                size: fields.taglia || '',
                jerseyNumber: fields['n. maglia'] || '',
                jerseyTraining: fields['Maglia all.'] || ''
            };
        });

        // Parse matches
        const matches = partite.records.map(record => {
            const fields = record.fields;
            return {
                id: record.id,
                type: 'match',
                title: fields.Avversario ? `TC Caneva vs ${fields.Avversario}` : 'Partita',
                date: fields.Data || '',
                time: fields.Ora || '',
                location: fields.Luogo || '',
                opponent: fields.Avversario || ''
            };
        });

        // Parse trainings
        const trainings = allenamenti.records.map(record => {
            const fields = record.fields;
            return {
                id: record.id,
                type: 'training',
                title: fields.Titolo || 'Allenamento',
                date: fields.Data || '',
                time: fields.Ora || '',
                location: fields.Luogo || ''
            };
        });

        const finalData = {
            players: players,
            events: [...matches, ...trainings]
        };

        console.log('=== DATI ESTRATTI ===\n');
        console.log(JSON.stringify(finalData, null, 2));

        return finalData;
    } catch (error) {
        console.error('Errore:', error.message);
    }
}

fetchAllData();
