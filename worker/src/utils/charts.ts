export function generateTrendChartUrl(
    label: string,
    history: number[],
    prediction: number,
    upperBound: number,
    lowerBound: number
): string {
    const baseUrl = "https://quickchart.io/chart";
    const labels = [...history.map((_, i) => `D-${history.length - i}`), "Tomorrow"];

    const lastVal = history[history.length - 1];
    const historyData = [...history, null];

    const predictionData = Array(history.length).fill(null);
    predictionData[history.length - 1] = lastVal;
    predictionData.push(prediction);

    const upperData = Array(history.length).fill(null);
    upperData[history.length - 1] = lastVal;
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
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0,
                },
                {
                    label: 'Prediction',
                    data: predictionData,
                    borderColor: '#10b981', // Green
                    borderDash: [5, 5],
                    borderWidth: 2,
                    fill: false,
                },
                {
                    label: 'Upper Limit',
                    data: upperData,
                    borderColor: '#ef4444', // Red
                    borderWidth: 1,
                    borderDash: [2, 2],
                    pointRadius: 0,
                },
                {
                    label: 'Lower Limit',
                    data: lowerData,
                    borderColor: '#ef4444',
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
                labels: { fontColor: '#a1a1aa', fontSize: 10 }
            },
            scales: {
                xAxes: [{ display: false }],
                yAxes: [{
                    gridLines: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { fontColor: '#71717a', fontSize: 10 }
                }]
            }
        }
    };

    return `${baseUrl}?c=${encodeURIComponent(JSON.stringify(config))}&backgroundColor=%23050505&width=500&height=300&format=png`;
}

export function generateMetricChartUrl(
    history: number[],
    threshold: number,
    color: string = '#D4AF37', // Gold default
    isDark: boolean = true
): string {
    const baseUrl = "https://quickchart.io/chart";
    const labels = history.map((_, i) => i);

    const config = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    data: history,
                    borderColor: color,
                    borderWidth: 3,
                    fill: false,
                    pointRadius: 0,
                    tension: 0.3
                },
                {
                    data: Array(history.length).fill(threshold),
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                    borderDash: [3, 3],
                    borderWidth: 1.5,
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            maintainAspectRatio: false,
            legend: { display: false },
            scales: {
                xAxes: [{ display: false }],
                yAxes: [{
                    display: false,
                    ticks: {
                        suggestedMin: Math.min(...history, threshold) * 0.95,
                        suggestedMax: Math.max(...history, threshold) * 1.05
                    }
                }]
            }
        }
    };

    const bgColor = isDark ? '%23050505' : 'transparent';
    return `${baseUrl}?c=${encodeURIComponent(JSON.stringify(config))}&backgroundColor=${bgColor}&width=200&height=80&format=png`;
}

export function generateExpertRiskChartUrl(
    history: number[]
): string {
    const baseUrl = "https://quickchart.io/chart";
    const labels = history.map((_, i) => `D-${history.length - i}`);

    const config = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Aggregate Risk Score',
                    data: history,
                    borderColor: '#D4AF37',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#D4AF37'
                },
                {
                    label: 'Warning Threshold (5)',
                    data: Array(history.length).fill(5),
                    borderColor: 'rgba(239, 68, 68, 0.5)',
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0,
                }
            ]
        },
        options: {
            maintainAspectRatio: false,
            legend: { labels: { fontColor: '#a1a1aa' } },
            scales: {
                yAxes: [{
                    ticks: { min: 0, max: 18, fontColor: '#71717a', fontSize: 10 },
                    gridLines: { color: 'rgba(255,255,255,0.05)' }
                }],
                xAxes: [{ display: false }]
            }
        }
    };

    return `${baseUrl}?c=${encodeURIComponent(JSON.stringify(config))}&backgroundColor=%23050505&width=600&height=300&format=png`;
}

