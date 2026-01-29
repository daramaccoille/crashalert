import React from 'react';

interface TrendChartPreviewProps {
    label: string;
    color: string;
}

export default function TrendChartPreview({ label, color }: TrendChartPreviewProps) {
    // Mock data for preview
    const history = [15, 16, 15.5, 17, 16.8, 17.5, 18];
    const prediction = 19;

    // Construct QuickChart URL (matching Worker logic)
    const chartConfig = {
        type: 'line',
        data: {
            labels: ['D-7', 'D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'D-1', 'Tomorrow'],
            datasets: [
                {
                    label: 'History',
                    data: [...history, null],
                    borderColor: 'rgba(255,255,255,0.8)',
                    borderWidth: 2,
                    fill: false,
                    pointRadius: 0,
                },
                {
                    label: 'AI Prediction',
                    data: [null, null, null, null, null, null, 18, prediction], // Connect last point
                    borderColor: color, // Dynamic color (Red/Green)
                    borderDash: [5, 5],
                    borderWidth: 2,
                    pointRadius: 3,
                    backgroundColor: color,
                },
                {
                    label: 'Normal Range',
                    data: [null, null, null, null, null, null, 18, 20],
                    borderColor: 'rgba(255,255,255,0.2)',
                    borderWidth: 1,
                    borderDash: [2, 2],
                    fill: '+1', // Fill to next dataset
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    pointRadius: 0,
                },
                {
                    label: 'Lower Range',
                    data: [null, null, null, null, null, null, 18, 17],
                    borderColor: 'rgba(255,255,255,0.2)',
                    borderWidth: 1,
                    borderDash: [2, 2],
                    pointRadius: 0,
                }
            ]
        },
        options: {
            legend: { display: true, labels: { fontColor: '#ccc', fontSize: 10 } },
            scales: {
                xAxes: [{ display: false }],
                yAxes: [{ gridLines: { color: 'rgba(255,255,255,0.1)' }, ticks: { fontColor: '#666', fontSize: 10 } }]
            }
        }
    };

    const url = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&width=400&height=200&backgroundColor=transparent`;

    return (
        <div className="bg-black/40 border border-white/10 rounded-lg p-4 flex flex-col items-center">
            <div className="text-xs text-gray-400 mb-2 w-full text-left">EMAIL PREVIEW: {label}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Chart Preview" className="w-full h-auto rounded opacity-90 hover:opacity-100 transition" />
            <div className="mt-2 text-[10px] text-gray-500 flex gap-2">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-white/80"></div> History</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: color }}></div> AI Prediction</span>
            </div>
        </div>
    );
}
