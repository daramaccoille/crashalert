import requests
import pandas as pd
import numpy as np
import io
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from the root .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# CONFIGURATION
WORKER_URL = os.getenv("INDICATOR_WORKER_URL", "http://localhost:8787/trigger-update")
OECD_URL = "https://sdmx.oecd.org/public/rest/data/OECD.SDD.STES,DSD_STES@DF_CLI,4.1/G20.M.LI...AA...H?dimensionAtObservation=AllDimensions&format=csvfilewithlabels"

def harvest_oecd():
    print("Harvesting OECD CLI Data...")
    try:
        response = requests.get(OECD_URL, timeout=15)
        response.raise_for_status()
        raw_df = pd.read_csv(io.StringIO(response.text))
        
        df = raw_df[['TIME_PERIOD', 'OBS_VALUE']].copy()
        df.columns = ['Date', 'Value']
        df['Date'] = pd.to_datetime(df['Date'])
        df = df.sort_values('Date')
        
        # Calculate Momentum
        df['Log_Diff'] = np.log(df['Value']) - np.log(df['Value'].shift(1))
        df['Smoothed_Momentum'] = df['Log_Diff'].rolling(window=3).mean()
        
        latest = df.iloc[-1]
        previous = df.iloc[-2]
        
        oecd_payload = {
            "latest_value": float(latest['Value']),
            "momentum": float(latest['Smoothed_Momentum']),
            "trend": "improving" if latest['Smoothed_Momentum'] > previous['Smoothed_Momentum'] else "declining"
        }
        print(f"Success: Momentum = {oecd_payload['momentum']:.6f} ({oecd_payload['trend']})")
        return oecd_payload
    except Exception as e:
        print(f"Error harvesting OECD: {e}")
        return None

def push_to_worker(oecd_data):
    if not oecd_data:
        return
    
    print(f"Pushing data to Worker at {WORKER_URL}...")
    payload = {
        "oecd": oecd_data
    }
    
    try:
        response = requests.post(WORKER_URL, json=payload)
        if response.status_code == 200:
            print("Successfully pushed to Cloudflare/Local Worker!")
            print(response.json())
        else:
            print(f"Failed to push: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Connection Error: {e}")

if __name__ == "__main__":
    data = harvest_oecd()
    push_to_worker(data)
