export async function fetchFredSeries(seriesId: string, apiKey: string): Promise<{ value: number; date: string }> {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`FRED API error: ${response.statusText}`);
        }
        const data: any = await response.json();

        if (!data.observations || data.observations.length === 0) {
            throw new Error(`No observations found for FRED series: ${seriesId}`);
        }

        const obs = data.observations[0];
        const value = parseFloat(obs.value);

        if (isNaN(value)) {
            // Sometimes FRED returns "." for missing data on holidays, need to handle retry or fallback?
            // For now, throw error so we can catch it.
            throw new Error(`Invalid numeric value for FRED series ${seriesId}: ${obs.value}`);
        }

        return { value, date: obs.date };
    } catch (error) {
        console.error(`Failed to fetch FRED series ${seriesId}:`, error);
        throw error;
    }
}
