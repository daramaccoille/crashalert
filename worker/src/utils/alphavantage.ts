export class AlphaVantageClient {
    private apiKey: string;
    private baseUrl = "https://www.alphavantage.co/query";

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private async request(params: Record<string, string>) {
        const url = new URL(this.baseUrl);
        params.apikey = this.apiKey;
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        const res = await fetch(url.toString());
        const data: any = await res.json();

        if (data["Error Message"]) throw new Error(data["Error Message"]);
        if (data["Note"]) throw new Error(`Alpha Vantage Rate Limit: ${data["Note"]}`);

        return data;
    }

    async getGlobalQuote(symbol: string): Promise<number> {
        const data = await this.request({
            function: "GLOBAL_QUOTE",
            symbol,
        });

        const quote = data["Global Quote"];
        if (!quote || !quote["05. price"]) {
            // Fallback or retry logic could go here
            throw new Error(`No quote data for ${symbol}`);
        }
        return parseFloat(quote["05. price"]);
    }

    async getDailyCloses(symbol: string, outputSize: 'compact' | 'full' = 'compact'): Promise<number[]> {
        // TIME_SERIES_DAILY
        const data = await this.request({
            function: "TIME_SERIES_DAILY",
            symbol,
            outputsize: outputSize
        });

        const timeSeries = data["Time Series (Daily)"];
        if (!timeSeries) throw new Error(`No Daily Time Series for ${symbol}`);

        // Sort dates descending
        const dates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        // Map to closes
        return dates.map(d => parseFloat(timeSeries[d]["4. close"]));
    }
}
