import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
import requests
import io
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="CrashAlert Indicator Bridge")

# Allow the worker to fetch from here
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def calculate_oecd_momentum():
    """
    Fetches live OECD CLI data for G20, calculates momentum, and handles fallbacks.
    CSV: stores last 6 years.
    Live/Chart: displays last 3 years.
    """
    csv_path = 'oecd_cli_g20.csv'
    url = "https://sdmx.oecd.org/public/rest/data/OECD.SDD.STES,DSD_STES@DF_CLI,4.1/G20.M.LI...AA...H?dimensionAtObservation=AllDimensions&format=csvfilewithlabels"
    
    df = None
    source = "live"

    try:
        # 1. Attempt Live Fetch
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        raw_df = pd.read_csv(io.StringIO(response.text))
        
        # Clean and format
        df = raw_df[['TIME_PERIOD', 'OBS_VALUE']].copy()
        df.columns = ['Date', 'Value']
        df['Date'] = pd.to_datetime(df['Date'])
        df = df.sort_values('Date')
        
        # 2. Filter for last 6 years for CSV
        six_years_ago = pd.Timestamp.now() - pd.DateOffset(years=6)
        df_6y = df[df['Date'] >= six_years_ago].copy()
        df_6y.to_csv(csv_path, index=False)
        df = df_6y # Work with at least 6 years for momentum stability
        
    except Exception as e:
        print(f"Live fetch failed ({e}), attempting fallback to {csv_path}")
        source = "fallback"
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path, parse_dates=['Date'])
            df = df.sort_values('Date')
        else:
            return {"error": "No data available (live or fallback)", "status": "critical"}

    # 3. Process Logic (Calculated on 6 years to avoid start-of-series artifacts)
    df['Log_Diff'] = np.log(df['Value']) - np.log(df['Value'].shift(1))
    df['Smoothed_Momentum'] = df['Log_Diff'].rolling(window=3).mean()
    
    # 4. Filter for last 3 years for Visualization and Response
    three_years_ago = pd.Timestamp.now() - pd.DateOffset(years=3)
    df_3y = df[df['Date'] >= three_years_ago].copy()

    # 5. Render Chart (3 years only)
    try:
        plt.figure(figsize=(10, 6))
        plt.subplot(2, 1, 1)
        plt.plot(df_3y['Date'], df_3y['Value'], label='OECD G20 CLI (3Y)', color='#d4af37', linewidth=2)
        plt.title('OECD G20 Composite Leading Indicator (Last 3 Years)')
        plt.grid(alpha=0.3)
        plt.legend()
        
        plt.subplot(2, 1, 2)
        plt.plot(df_3y['Date'], df_3y['Smoothed_Momentum'], label='Smoothed Momentum', color='red')
        plt.axhline(0, color='black', linestyle='--')
        plt.fill_between(df_3y['Date'], 0, df_3y['Smoothed_Momentum'], where=(df_3y['Smoothed_Momentum'] > 0), color='green', alpha=0.3)
        plt.fill_between(df_3y['Date'], 0, df_3y['Smoothed_Momentum'], where=(df_3y['Smoothed_Momentum'] < 0), color='red', alpha=0.3)
        plt.title('Economic Momentum (Acceleration/Deceleration)')
        plt.grid(alpha=0.3)
        plt.legend()
        
        plt.tight_layout()
        plt.savefig('oecd_indicator_plot.png')
        plt.close()
    except Exception as chart_err:
        print(f"Chart rendering error: {chart_err}")

    # 6. Prepare Payload (Based on 3Y data)
    latest = df_3y.iloc[-1]
    previous = df_3y.iloc[-2]
    
    return {
        "indicator": "OECD CLI G20",
        "latest_value": round(float(latest['Value']), 4),
        "momentum": round(float(latest['Smoothed_Momentum']), 6),
        "trend": "improving" if latest['Smoothed_Momentum'] > previous['Smoothed_Momentum'] else "declining",
        "is_positive": bool(latest['Smoothed_Momentum'] > 0),
        "last_updated": str(latest['Date'].date()),
        "data_source": source,
        "period": "3-year view (6-year fallback)"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.get("/indicators/oecd")
def get_oecd():
    return calculate_oecd_momentum()

@app.get("/indicators/all")
def get_all():
    return {
        "oecd": calculate_oecd_momentum(),
        # Add more indicators here as you build them
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
