const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Serve the HTML file from the 'public' directory

// Dexscreener API Endpoint
const DEXSCREENER_API_URL = 'https://api.dexscreener.com/latest/dex/search?q=SOL/USDC';

// Helper: Fetch Data from API
const fetchData = () => {
    return new Promise((resolve, reject) => {
        https.get(DEXSCREENER_API_URL, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData.pairs || []);
                } catch (error) {
                    reject(`Error parsing JSON: ${error.message}`);
                }
            });
        }).on('error', (error) => {
            reject(`Error fetching data: ${error.message}`);
        });
    });
};

// Helper: Filter Data
const filterData = (data, filters) => {
    return data.filter(pair => {
        const liquidity = pair.liquidity?.usd || 0;
        const fdv = pair.fdv || 0;
        const volume24h = pair.volume?.h24 || 0;
        const transactions24h = (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0);

        return (
            liquidity >= filters.minLiquidity &&
            fdv >= filters.minFdv &&
            volume24h >= filters.minVolume24h &&
            transactions24h >= filters.minTransactions24h
        );
    });
};

// API Route
app.post('/api/filter', async (req, res) => {
    try {
        const filters = req.body;
        const rawData = await fetchData();
        const filteredData = filterData(rawData, filters);
        res.json(filteredData);
    } catch (error) {
        console.error(`Error: ${error}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
