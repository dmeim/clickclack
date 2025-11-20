
const fs = require('fs');
const path = require('path');

const files = ['short.json', 'medium.json', 'long.json', 'xl.json'];
const baseDir = 'app/public/quotes';

try {
    const allQuotes = [];
    files.forEach(file => {
        const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
        const quotes = JSON.parse(content);
        allQuotes.push(...quotes);
    });

    // Deduplicate based on quote text
    const uniqueQuotes = Array.from(new Map(allQuotes.map(q => [q.quote, q])).values());

    console.log(`Total unique quotes: ${uniqueQuotes.length}`);


    const histogram = new Array(10).fill(0);
    uniqueQuotes.forEach(q => {
        const len = q.quote.length;
        const bucket = Math.min(Math.floor(len / 50), 9);
        histogram[bucket]++;
    });

    console.log('Length Histogram (buckets of 50):');
    histogram.forEach((count, i) => {
        console.log(`${i * 50} - ${(i + 1) * 50}: ${count}`);
    });

} catch (err) {
    console.error("Error:", err);
}
