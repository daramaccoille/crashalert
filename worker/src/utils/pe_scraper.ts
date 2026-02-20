
export async function scrapeSP500PE(): Promise<number> {
    const url = "https://www.multpl.com/s-p-500-pe-ratio/table/by-month";
    const defaultPE = 29.5; // Fallback to current if scraping fails

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) throw new Error(`Failed to fetch PE: ${response.status}`);

        const html = await response.text();

        // The table looks like: <tr><td>Feb 19, 2026</td><td class="col2">29.48</td></tr>
        // We look for the first instance of col2 after the first tr
        const match = html.match(/<td class="col2">\s*([\d.]+)/);

        if (match && match[1]) {
            const pe = parseFloat(match[1]);
            console.log(`Scraped S&P 500 PE: ${pe}`);
            return pe;
        }

        console.warn("Could not find PE ratio in HTML, using fallback.");
        return defaultPE;
    } catch (error) {
        console.error("Error scraping PE ratio:", error);
        return defaultPE;
    }
}
