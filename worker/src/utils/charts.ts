export function generateTrendChartUrl(
    label: string,
    history: number[],
    prediction: number,
    upperBound: number,
    lowerBound: number
): string {
    // QuickChart API URL
    const baseUrl = "https://quickchart.io/chart";

    // Construct labels: Past 30 days + "Tomorrow"
    const labels = [...history.map((_, i) => `D-${history.length - i}`), "Tomorrow"];

    // Data Series 1: History (ending at T-0)
    const historyData = [...history, null]; // append null for prediction slot

    // Data Series 2: Prediction (only at T+1)
    // We assume the last point of history connects to prediction? 
    // Better visual: [..., lastVal, prediction]
    const lastVal = history[history.length - 1];
    const predictionData = Array(history.length).fill(null);
    predictionData[history.length - 1] = lastVal;
    predictionData.push(prediction);

    // Data Series 3: Upper Bound (Line or Band)
    // Simple implementation: Dotted line for bounds on the prediction day
    const upperData = Array(history.length).fill(null);
    upperData[history.length - 1] = lastVal; // Anchor
    upperData.push(upperBound);

    const lowerData = Array(history.length).fill(null);
    lowerData[history.length - 1] = lastVal;
    lowerData.push(lowerBound);

    const config = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: label,
                    data: historyData,
                    borderColor: 'rgb(255, 255, 255)', // White line
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0,
                },
                {
                    label: 'Prediction',
                    data: predictionData,
                    borderColor: 'rgb(16, 185, 129)', // Green
                    borderDash: [5, 5],
                    borderWidth: 2,
                    fill: false,
                },
                {
                    label: 'Upper Limit',
                    data: upperData,
                    borderColor: 'rgb(239, 68, 68)', // Red
                    borderWidth: 1,
                    borderDash: [2, 2],
                    pointRadius: 0,
                },
                {
                    label: 'Lower Limit',
                    data: lowerData,
                    borderColor: 'rgb(239, 68, 68)',
                    borderWidth: 1,
                    borderDash: [2, 2],
                    pointRadius: 0,
                }
            ]
        },
        options: {
            maintainAspectRatio: false,
            legend: {
                display: true,
                labels: { fontColor: '#ccc' }
            },
            scales: {
                xAxes: [{
                    display: false, // Hide messy dates
                    gridLines: { display: false }
                }],
                yAxes: [{
                    gridLines: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { fontColor: '#999' }
                }]
            }
        }
    };

    // Encode URL
    return `${baseUrl}?c=${encodeURIComponent(JSON.stringify(config))}&backgroundColor=transparant&width=500&height=300&format=png`;
}
