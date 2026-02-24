import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import requests
import io
import os

# 1. Configuration
csv_path = 'oecd_cli_g20.csv'
url = "https://sdmx.oecd.org/public/rest/data/OECD.SDD.STES,DSD_STES@DF_CLI,4.1/G20.M.LI...AA...H?dimensionAtObservation=AllDimensions&format=csvfilewithlabels"

print("OECD G20 CLI Analysis")
print("-" * 20)

# 2. Load Data
df = None
try:
    print(f"Attempting to fetch live data from OECD...")
    response = requests.get(url, timeout=15)
    response.raise_for_status()
    
    raw_df = pd.read_csv(io.StringIO(response.text))
    df = raw_df[['TIME_PERIOD', 'OBS_VALUE']].copy()
    df.columns = ['Date', 'Value']
    df['Date'] = pd.to_datetime(df['Date'])
    df = df.sort_values('Date')
    
    # Save fallback (Limit to 6 years)
    six_years_ago = pd.Timestamp.now() - pd.DateOffset(years=6)
    df_6y = df[df['Date'] >= six_years_ago].copy()
    df_6y.to_csv(csv_path, index=False)
    df = df_6y
    print("Live data harvested (6-year fallback updated).")
    
except Exception as e:
    print(f"Live fetch failed: {e}")
    if os.path.exists(csv_path):
        print(f"Loading data from fallback: {csv_path}")
        df = pd.read_csv(csv_path, parse_dates=['Date'])
        df = df.sort_values('Date')
    else:
        print("CRITICAL: No data found.")
        exit(1)

# 3. Process Logic (Calculated on 6 years)
df['Log_Diff'] = np.log(df['Value']) - np.log(df['Value'].shift(1))
df['Smoothed_Momentum'] = df['Log_Diff'].rolling(window=3).mean()

# 4. Filter for 3-year Visualization
three_years_ago = pd.Timestamp.now() - pd.DateOffset(years=3)
df_3y = df[df['Date'] >= three_years_ago].copy()

# 5. Summary Statistics (Based on 3-year set)
latest = df_3y.iloc[-1]
previous = df_3y.iloc[-2]
trend = "IMPROVING" if latest['Smoothed_Momentum'] > previous['Smoothed_Momentum'] else "DECLINING"
status = "POSITIVE" if latest['Smoothed_Momentum'] > 0 else "NEGATIVE"

print(f"\nLatest Date: {latest['Date'].date()}")
print(f"Value:       {latest['Value']:.4f}")
print(f"Momentum:    {latest['Smoothed_Momentum']:.6f}")
print(f"Trend:       {trend}")
print(f"Status:      {status}")

# 6. Plotting (3-year view)
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8), sharex=True)

# Plot 1: Raw Index
ax1.plot(df_3y['Date'], df_3y['Value'], color='#d4af37', linewidth=2, label='G20 CLI Index (3Y)')
ax1.set_ylabel('Index Value')
ax1.set_title('OECD Composite Leading Indicator (G20 Aggregate) - 3 Year View', fontsize=14, fontweight='bold')
ax1.grid(alpha=0.3)
ax1.legend()

# Plot 2: Momentum
ax2.plot(df_3y['Date'], df_3y['Smoothed_Momentum'], color='red', linewidth=1.5, label='3-Mo Smoothed Momentum')
ax2.axhline(0, color='black', linestyle='--', linewidth=1)
ax2.fill_between(df_3y['Date'], 0, df_3y['Smoothed_Momentum'], where=(df_3y['Smoothed_Momentum'] > 0), color='green', alpha=0.3)
ax2.fill_between(df_3y['Date'], 0, df_3y['Smoothed_Momentum'], where=(df_3y['Smoothed_Momentum'] < 0), color='red', alpha=0.3)
ax2.set_ylabel('Growth Rate (Log Diff)')
ax2.set_title('Economic Momentum (Acceleration/Deceleration)', fontsize=12)
ax2.grid(alpha=0.3)
ax2.legend()

plt.tight_layout()
plt.show() # This will open a window in local interactive environments