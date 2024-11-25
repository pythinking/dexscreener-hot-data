const https = require('https');

// Dexscreener API Endpoint
const DEXSCREENER_API_URL = 'https://api.dexscreener.com/latest/dex/search?q=SOL/USDC';

// Helper: Fetch Data from API
const fetchData = () => {
    return new Promise((resolve, reject) => {
        https.get(DEXSCREENER_API_URL, (res) => {
            let data = '';

            // Collect data chunks
            res.on('data', (chunk) => {
                data += chunk;
            });

            // Handle response end
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    if (jsonData.pairs) {
                        resolve(jsonData.pairs); // Return pairs from the response
                    } else {
                        console.error('No pairs found in the response.');
                        resolve([]); // Return an empty array if no pairs
                    }
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
        const liquidity = pair.liquidity?.usd || 0; // Fallback to 0 if undefined
        const fdv = pair.fdv || 0; // Fallback to 0 if undefined
        const volume24h = pair.volume?.h24 || 0; // Fallback to 0 if undefined
        const transactions24h = (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0); // Fallback to 0

        return (
            liquidity >= filters.minLiquidity &&
            fdv >= filters.minFdv &&
            volume24h >= filters.minVolume24h &&
            transactions24h >= filters.minTransactions24h
        );
    });
};

// Define Filters
const filters = {
    minLiquidity: 10000, // Minimum liquidity in USD
    minFdv: 100000, // Minimum FDV in USD
    minVolume24h: 50000, // Minimum 24h volume in USD
    minTransactions24h: 50, // Minimum 24h transactions
};

// Display Data on Console
const displayData = (data) => {
    if (!data || data.length === 0) {
        console.log('No pairs found in the data.');
        return;
    }

    console.log('Cryptocurrency Pairs Data:');
    console.log('--------------------------------');
    data.forEach(pair => {
        const liquidityUSD = pair.liquidity?.usd || 0; // Fallback to 0
        const volume24hUSD = pair.volume?.h24 || 0; // Fallback to 0
        const priceUSD = pair.priceUsd || 'N/A'; // Handle missing prices
        const txns24h = (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0); // Adjusted transactions calculation

        console.log(`DEX: ${pair.dexId}`);
        console.log(`Pair Address: ${pair.pairAddress}`);
        console.log(`Base Token: ${pair.baseToken.name} (${pair.baseToken.symbol})`);
        console.log(`Quote Token: ${pair.quoteToken.name} (${pair.quoteToken.symbol})`);
        console.log(`Price (USD): $${priceUSD}`);
        console.log(`24H Volume (USD): $${volume24hUSD.toFixed(2)}`);
        console.log(`Liquidity (USD): $${liquidityUSD.toFixed(2)}`);
        console.log(`24H Transactions: ${txns24h}`);
        console.log(`URL: ${pair.url}`);
        console.log('--------------------------------');
    });
};

// Main Function
const main = async () => {
    try {
        const rawData = await fetchData();
        const filteredData = filterData(rawData, filters);

        if (filteredData.length === 0) {
            console.log('No pairs matched the filters.');
        } else {
            displayData(filteredData);
        }

        // Commented out Excel export functionality
        /*
        await exportToExcel(filteredData);
        */
    } catch (error) {
        console.error(`Error: ${error}`);
    }
};

main();
