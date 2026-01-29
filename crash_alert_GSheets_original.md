## CRASHALERT.INFO
Crash alert is a website that charges users to get alerts about crashes.

## template
Indicator	Description	Formula / Data Source	Current Value	Risk Level	Notes	Sparkline	Last updated
VIX (Volatility Index)	Market fear gauge	Google formula 0-10-20-30	16.45	0	Rising volatility = fear returning		
10yr/2yr Yield Curve	Recession signal (spread)	script -FRED 10yr-2yr updateYieldSpread()	0.71	0	Deep inversion = credit stress		Updated: 1/29/2026, 7:01:31 AMspread: 0.7100000000000004
S&P 500	Market trend	GF -10, -5, 5 , 10	-0.01	0	Watch for sharp drops on high volume		
S&P 500 P/E Ratio	Valuation measure	25-28	27.84	1	what is the current figure for S&P 500 P/E Ratio		Updated: 1/6/2026, 7:48:37 PM | Price: $687.72 | EPS: $23.00 | P/E: 29.90
Junk Bond Spread	Credit market stress	Manual (FRED: BAMLH0A0HYM2)	2.71	-1	LOW		Updated: 1/29/2026, 7:01:32 AM | Spread: 3 bps | Data: 2026-01-27
Margin Debt	Investor leverage	1126	1126	1	HIGH		Manual data from: 11/11/2025 | Margin: $1126.0B | Source: FINRA
Insider Activity	Exec buying/selling ratio	0.33	0.33	0	MODERATE		Manual from: 11/11/2025 | Ratio: 0.33 | Below median | Median: 0.34 | Source: GuruFocus
PMI (Purchasing Mgrs Index)	Economic strength	Manual (ISM or TradingEconomics)	-0.04	0	MODERATE		Updated: 1/29/2026, 7:01:34 AM | CFNAI: -0.04 | Below trend | Data: 2025-11-01 | Source: Chicago Fed via FRED
Central Bank Liquidity	Policy stance	6.58458	6.58	0	MODERATE		Updated: 1/29/2026, 7:01:34 AM | Assets: $6.58T | Trend: Stable | Data: 2026-01-21 | Source: Fed via FRED
Investor Sentiment	Crowd optimism/pessimism	Manual (AAII Sentiment Survey)	0.6290217696	-1	LOW		Updated: 1/29/2026, 7:01:35 AM | FRED: $0.631MonthAhead | Data: 2025

## Script
function checkCrashRisk() {
  updateYieldSpread();
  updateJunkBondSpread();
  updateMarginDebt();
  updateInsiderActivity();
  updateCFNAI();
  updateCentralBankLiquidity();
  updateOneMonthAhead();
  updateMarketMode();



var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CrashAlert");
const totalRedFlags = sheet.getRange("B14").getValue(); 
const marketMode = sheet.getRange("B15").getValue();

if (totalRedFlags >= 2) {
const subject = "⚠️ Crash Alert: Market Risk Level High";
const message = `Crash Alert Dashboard Warning\n\nRed Flags: ${totalRedFlags}\nMarket Mode: ${marketMode}\n\nReview your portfolio for risk management.`;
MailApp.sendEmail("daramaccoille@yahoo.com", subject, message);
}
}
/**
 * Alpha Vantage Client with:
 * - Centralized request handling
 * - Caching
 * - Exponential backoff on rate limits / transient errors
 * - Automatic detection of all valid time-series keys
 */
var AlphaVantageClient = (function () {
  var memoryCache = {};
  var USE_SCRIPT_CACHE = false; 
  var CACHE_TTL_MS = 60 * 1000;

  function AlphaVantageClient(apiKey) {
    if (!apiKey) throw new Error("Alpha Vantage API key is required.");
    this.apiKey = apiKey;
    this.baseUrl = "https://www.alphavantage.co/query";
  }

  AlphaVantageClient.prototype._makeCacheKey = function (params) {
    return JSON.stringify(params);
  };

  AlphaVantageClient.prototype._getFromCache = function (key) {
    var now = Date.now();

    if (memoryCache[key] && (now - memoryCache[key].timestamp < CACHE_TTL_MS)) {
      return memoryCache[key].data;
    }

    if (USE_SCRIPT_CACHE) {
      var props = PropertiesService.getScriptProperties();
      var raw = props.getProperty(key);
      if (raw) {
        try {
          var saved = JSON.parse(raw);
          if (now - saved.timestamp < CACHE_TTL_MS) {
            memoryCache[key] = saved;
            return saved.data;
          }
        } catch (e) {}
      }
    }

    return null;
  };

  AlphaVantageClient.prototype._saveToCache = function (key, data) {
    var payload = { timestamp: Date.now(), data: data };
    memoryCache[key] = payload;

    if (USE_SCRIPT_CACHE) {
      PropertiesService.getScriptProperties().setProperty(key, JSON.stringify(payload));
    }
  };

  AlphaVantageClient.prototype.request = function (params, options) {
    options = options || {};
    var maxRetries = options.maxRetries || 3;
    var initialDelay = options.initialDelay || 1500;
    var cache = options.cache !== false;

    params.apikey = this.apiKey;

    var cacheKey = this._makeCacheKey(params);
    if (cache) {
      var cached = this._getFromCache(cacheKey);
      if (cached) return cached;
    }

    var url = this.baseUrl + "?" + Object.keys(params)
      .map(k => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
      .join("&");

    var attempt = 0;
    var delay = initialDelay;

    while (attempt <= maxRetries) {
      try {
        var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
        var json = JSON.parse(resp.getContentText());

        if (json.Note) throw new Error("Alpha Vantage rate limit: " + json.Note);
        if (json["Error Message"]) throw new Error("Alpha Vantage error: " + json["Error Message"]);

        if (cache) this._saveToCache(cacheKey, json);
        return json;

      } catch (e) {
        attempt++;
        if (attempt > maxRetries) {
          throw new Error("Alpha Vantage request failed after retries: " + e.message);
        }
        Utilities.sleep(delay);
        delay *= 2;
      }
    }

    throw new Error("Unexpected AlphaVantageClient.request exit.");
  };

  /**
   * Extracts any valid time-series key.
   */
  AlphaVantageClient.prototype.extractTimeSeries = function (data) {
    const possibleKeys = [
      "Time Series (Daily)",
      "Time Series (Daily Adjusted)",
      "Time Series (5min)",
      "Time Series (15min)",
      "Time Series (30min)",
      "Time Series (60min)",
      "Time Series (Weekly)",
      "Time Series (Monthly)"
    ];

    for (var i = 0; i < possibleKeys.length; i++) {
      if (data[possibleKeys[i]]) {
        return data[possibleKeys[i]];
      }
    }

    throw new Error("Alpha Vantage returned no usable time series.");
  };

  AlphaVantageClient.prototype.getGlobalQuote = function (symbol) {
    var data = this.request({
      "function": "GLOBAL_QUOTE",
      symbol: symbol
    });

    if (!data["Global Quote"] || !data["Global Quote"]["05. price"]) {
      throw new Error("Global Quote data missing for " + symbol);
    }

    return {
      price: parseFloat(data["Global Quote"]["05. price"]),
      raw: data
    };
  };

AlphaVantageClient.prototype.getDailyCloses = function (symbol, count) {
  var attempts = 0;
  var maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;

    try {
      // Primary request
      var data = this.request({
        "function": "TIME_SERIES_DAILY",
        symbol: symbol
      });

      var series = this.extractTimeSeries(data);

      var dates = Object.keys(series).sort((a, b) => new Date(b) - new Date(a));
      var closes = dates.map(d => parseFloat(series[d]["4. close"]));

      if (closes.length < count) {
        throw new Error("Not enough daily data for " + symbol);
      }

      return closes.slice(0, count);

    } catch (e) {
      // If extractTimeSeries failed, try fallback
      if (e.message.includes("no usable time series")) {
        Logger.log("Primary TIME_SERIES_DAILY failed, trying ADJUSTED…");

        try {
          var data2 = this.request({
            "function": "TIME_SERIES_DAILY_ADJUSTED",
            symbol: symbol
          });

          var series2 = this.extractTimeSeries(data2);

          var dates2 = Object.keys(series2).sort((a, b) => new Date(b) - new Date(a));
          var closes2 = dates2.map(d => parseFloat(series2[d]["4. close"]));

          if (closes2.length < count) {
            throw new Error("Not enough adjusted data for " + symbol);
          }

          return closes2.slice(0, count);

        } catch (e2) {
          Logger.log("Adjusted fallback also failed: " + e2);
        }
      }

      // Retry after delay
      Utilities.sleep(1500 * attempts);
    }
  }

  throw new Error("Alpha Vantage failed to return valid time series after retries.");
};


  return AlphaVantageClient;
})();


// FRED api key 0660086ceb0adf4839c6fcbfa35b3526
function getFredYield(seriesId) {
  var apiKey = "0660086ceb0adf4839c6fcbfa35b3526";
  var url = "https://api.stlouisfed.org/fred/series/observations?series_id=" 
            + seriesId + "&api_key=" + apiKey + "&file_type=json&sort_order=desc&limit=1";
  var response = UrlFetchApp.fetch(url);
  var data = JSON.parse(response.getContentText());
  return {
    value: parseFloat(data.observations[0].value),
    date: data.observations[0].date
  };
}

function updateYieldSpread() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CrashAlert");
  var tenYear = getFredYield("DGS10"); // 10-year yield
  var twoYear = getFredYield("DGS2");  // 2-year yield
  var spread = tenYear.value - twoYear.value;

  // Write the spread into cell D3
  sheet.getRange("D3").setValue(spread);
  sheet.getRange("H3").setValue("Updated: " + new Date().toLocaleString() + "spread: "+ spread);
}
function marketDropAlert() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CrashAlert");
  var spChange = sheet.getRange("D4").getValue();
  Logger.log(spChange.toString());
  const email = "daramaccoille@yahoo.com";
  const now = new Date();
  const hour = now.getUTCHours(); 
  Logger.log(hour);
if (hour < 14.0 || hour > 22.0) return;

  // If S&P is down more than 1% intraday → send alert
  if (spChange < -1) {
    MailApp.sendEmail({
      to: email,
      subject: "Market drop alert",
      body: "S&P 500 is down over 1% today. Check your positions."
    });
    Logger.log("email sent to "+email+" drop was "+spChange+"%")
  }

  // If S&P is down more than 3% → send stronger alert
  if (spChange < -3) {
    MailApp.sendEmail({
      to: email,
      subject: "⚠️ Major market drop",
      body: "S&P 500 is down over 3%. Consider hedging or reducing risk."
    });
  }
}
// Alphavantage API key BL1KL3HFI4C31SPD
// FMP API key zubtZtywD25fLNylg56OLYI1S5XSRIM6
// FRED key 0660086ceb0adf4839c6fcbfa35b3526
// Massive api key g0nS5o4CC6bA88MhdOvpK2pshzVII3YL


function updateJunkBondSpread() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CrashAlert");
  
  try {
    // Fetch High Yield spread from FRED
    var spreadData = getFredYield("BAMLH0A0HYM2");
    var spread = spreadData.value;
    
    // Assuming you want this in row 6 (adjust as needed)
    // Column D: Current spread value (in basis points)
    sheet.getRange("D6").setValue(spread);
    
    // Column E: Risk flag
    // Typical thresholds:
    // > 700 bps = High stress (1)
    // 400-700 bps = Moderate stress (0)
    // < 400 bps = Low stress (-1)
    var risk;
    if (spread > 700) {
      risk = 1;
    } else if (spread >= 400) {
      risk = 0;
    } else {
      risk = -1;
    }
    sheet.getRange("E6").setValue(risk);
    
    // Column F: Risk label
    var riskLabel = risk === 1 ? "HIGH" : (risk === 0 ? "MODERATE" : "LOW");
    sheet.getRange("F6").setValue(riskLabel);
    
    // Column H: Timestamp with details
    sheet.getRange("H6").setValue("Updated: " + new Date().toLocaleString() + 
                                   " | Spread: " + spread.toFixed(0) + " bps" +
                                   " | Data: " + spreadData.date);
    
  } catch (error) {
    sheet.getRange("D6").setValue("ERROR");
    sheet.getRange("E6").setValue(error.toString());
    Logger.log("Junk Bond Spread Error: " + error);
  }
}
function updateMarginDebt() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CrashAlert");
  
  try {
    // Try to get manual entry first
    var marginDebtCell = sheet.getRange("C7");
    var marginDebt = parseFloat(marginDebtCell.getValue());
    
    // If no manual entry, show reminder
    if (isNaN(marginDebt) || marginDebt <= 0) {
      sheet.getRange("D7").setValue("UPDATE NEEDED");
      sheet.getRange("E7").setValue(0);
      sheet.getRange("F7").setValue("MANUAL ENTRY");
      sheet.getRange("H7").setValue("Get latest from: https://www.finra.org/investors/learn-to-invest/advanced-investing/margin-statistics");
      return;
    }
    
    // Process the manual entry
    sheet.getRange("D7").setValue(marginDebt);
    
    // Risk thresholds (in billions)
    var risk;
    if (marginDebt > 900) {
      risk = 1;
    } else if (marginDebt >= 700) {
      risk = 0;
    } else {
      risk = -1;
    }
    
    sheet.getRange("E7").setValue(risk);
    
    var riskLabel = risk === 1 ? "HIGH" : (risk === 0 ? "MODERATE" : "LOW");
    sheet.getRange("F7").setValue(riskLabel);
    
    // Show when you last updated it
    var updateDate = marginDebtCell.getNote();
    if (!updateDate) {
      marginDebtCell.setNote(new Date().toLocaleDateString());
      updateDate = marginDebtCell.getNote();
    }
    
    sheet.getRange("H7").setValue("Manual data from: " + updateDate + 
                                   " | Margin: $" + marginDebt.toFixed(1) + "B" +
                                   " | Source: FINRA");
    
  } catch (error) {
    sheet.getRange("D7").setValue("ERROR");
    sheet.getRange("E7").setValue(error.toString());
    Logger.log("Margin Debt Error: " + error);
  }
}

function updateInsiderActivity() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CrashAlert");
  
  try {
    // Get manually entered buy/sell ratio from GuruFocus
    var ratioCell = sheet.getRange("C8");
    var buySellRatio = parseFloat(ratioCell.getValue());
    
    // If no manual entry, show reminder
    if (isNaN(buySellRatio)) {
      sheet.getRange("D8").setValue("UPDATE NEEDED");
      sheet.getRange("E8").setValue(0);
      sheet.getRange("F8").setValue("MANUAL ENTRY");
      sheet.getRange("H8").setValue("Get latest from: https://www.gurufocus.com/economic_indicators/4359/insider-buysell-ratio-usa-overall-market");
      return;
    }
    
    // Process the manual entry
    sheet.getRange("D8").setValue(buySellRatio.toFixed(2));
    
    // Risk thresholds based on GuruFocus historical data
    // Historical median: 0.34
    // Typical range: 0.18 to 0.64
    // Record low: 0.12 (extreme selling)
    // Record high: 2.01 (extreme buying)
    var risk;
    if (buySellRatio < 0.25) {
      risk = 1;  // HIGH RISK - Heavy insider selling (below typical range)
    } else if (buySellRatio < 0.40) {
      risk = 0;  // MODERATE RISK - Elevated selling (below median)
    } else {
      risk = -1; // LOW RISK - Normal to bullish (at or above median)
    }
    
    sheet.getRange("E8").setValue(risk);
    
    var riskLabel = risk === 1 ? "HIGH" : (risk === 0 ? "MODERATE" : "LOW");
    sheet.getRange("F8").setValue(riskLabel);
    
    // Add interpretation based on historical context
    var interpretation;
    if (buySellRatio < 0.18) {
      interpretation = "Extreme selling";
    } else if (buySellRatio < 0.25) {
      interpretation = "Heavy selling";
    } else if (buySellRatio < 0.34) {
      interpretation = "Below median";
    } else if (buySellRatio < 0.50) {
      interpretation = "Normal range";
    } else if (buySellRatio < 0.64) {
      interpretation = "Above average";
    } else {
      interpretation = "Strong buying";
    }
    
    // Show when you last updated it
    var updateDate = ratioCell.getNote();
    if (!updateDate) {
      ratioCell.setNote(new Date().toLocaleDateString());
      updateDate = ratioCell.getNote();
    }
    
    sheet.getRange("H8").setValue("Manual from: " + updateDate + 
                                   " | Ratio: " + buySellRatio.toFixed(2) +
                                   " | " + interpretation +
                                   " | Median: 0.34 | Source: GuruFocus");
    
  } catch (error) {
    sheet.getRange("D8").setValue("ERROR");
    sheet.getRange("E8").setValue(error.toString());
    Logger.log("Insider Activity Error: " + error);
  }
}
function updateCFNAI() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CrashAlert");
  
  try {
    // Fetch Chicago Fed National Activity Index from FRED
    var cfnaiData = getFredYield("CFNAI");
    var cfnai = cfnaiData.value;
    
    // Assuming row 9 for CFNAI (adjust as needed)
    // Column D: Current CFNAI value
    sheet.getRange("D9").setValue(cfnai.toFixed(2));
    
    // Column E: Risk flag
    // CFNAI thresholds (based on Chicago Fed research):
    // < -0.70 = High recession risk (1)
    // -0.70 to 0 = Below trend growth (0)
    // > 0 = At or above trend growth (-1)
    var risk;
    if (cfnai < -0.70) {
      risk = 1;  // HIGH RISK - Recession signal
    } else if (cfnai < 0) {
      risk = 0;  // MODERATE RISK - Below trend
    } else {
      risk = -1; // LOW RISK - Healthy growth
    }
    
    sheet.getRange("E9").setValue(risk);
    
    // Column F: Risk label
    var riskLabel = risk === 1 ? "HIGH" : (risk === 0 ? "MODERATE" : "LOW");
    sheet.getRange("F9").setValue(riskLabel);
    
    // Add interpretation
    var interpretation;
    if (cfnai < -0.70) {
      interpretation = "Recession risk";
    } else if (cfnai < -0.35) {
      interpretation = "Weak growth";
    } else if (cfnai < 0) {
      interpretation = "Below trend";
    } else if (cfnai < 0.50) {
      interpretation = "Normal growth";
    } else {
      interpretation = "Strong growth";
    }
    
    // Column H: Timestamp with details
    sheet.getRange("H9").setValue("Updated: " + new Date().toLocaleString() + 
                                   " | CFNAI: " + cfnai.toFixed(2) +
                                   " | " + interpretation +
                                   " | Data: " + cfnaiData.date +
                                   " | Source: Chicago Fed via FRED");
    
  } catch (error) {
    sheet.getRange("D9").setValue("ERROR");
    sheet.getRange("E9").setValue(error.toString());
    Logger.log("CFNAI Error: " + error);
  }
}
function updateCentralBankLiquidity() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CrashAlert");
  
  try {
    // Fetch Fed Total Assets from FRED (WALCL)
    var fedData = getFredYield("WALCL");
    var fedAssets = fedData.value; // in millions
    
    // Convert to trillions for easier reading
    var fedAssetsTrillion = fedAssets / 1000000;
    
    // Assuming row 10 for Central Bank Liquidity (adjust as needed)
    sheet.getRange("D10").setValue(fedAssetsTrillion.toFixed(2));
    
    // Risk assessment based on trend and historical context
    // Peak COVID: ~$8.97T (April 2022)
    // Pre-COVID: ~$4.2T (February 2020)
    // Current QT (Quantitative Tightening) phase: declining
    
    // Calculate rate of change (you can store previous value in a cell like C10)
    var previousValueCell = sheet.getRange("C10");
    var previousValue = parseFloat(previousValueCell.getValue());
    
    var trendDirection;
    var risk;
    
    if (!isNaN(previousValue) && previousValue > 0) {
      var changePercent = ((fedAssetsTrillion - previousValue) / previousValue) * 100;
      
      // Risk thresholds based on balance sheet trend
      // Rapid contraction (>2% decline) = Tightening = Higher risk
      // Stable (-2% to +2%) = Neutral
      // Expansion (>2% growth) = Easing = Lower risk
      if (changePercent < -2) {
        risk = 1;  // HIGH RISK - Aggressive tightening
        trendDirection = "Contracting";
      } else if (changePercent < 2) {
        risk = 0;  // MODERATE RISK - Stable/slow tightening
        trendDirection = "Stable";
      } else {
        risk = -1; // LOW RISK - Expanding/easing
        trendDirection = "Expanding";
      }
    } else {
      // First run - assess based on absolute level vs historical
      if (fedAssetsTrillion < 7.0) {
        risk = 1;  // Below typical QT trough
      } else if (fedAssetsTrillion < 8.0) {
        risk = 0;  // QT phase
      } else {
        risk = -1; // High liquidity support
      }
      trendDirection = "Baseline";
    }
    
    // Update previous value for next comparison
    previousValueCell.setValue(fedAssetsTrillion);
    
    sheet.getRange("E10").setValue(risk);
    
    var riskLabel = risk === 1 ? "HIGH" : (risk === 0 ? "MODERATE" : "LOW");
    sheet.getRange("F10").setValue(riskLabel);
    
    // Timestamp with details
    sheet.getRange("H10").setValue("Updated: " + new Date().toLocaleString() + 
                                    " | Assets: $" + fedAssetsTrillion.toFixed(2) + "T" +
                                    " | Trend: " + trendDirection +
                                    " | Data: " + fedData.date +
                                    " | Source: Fed via FRED");
    
  } catch (error) {
    sheet.getRange("D10").setValue("ERROR");
    sheet.getRange("E10").setValue(error.toString());
    Logger.log("Central Bank Liquidity Error: " + error);
  }
}


var FREDKEY = '0660086ceb0adf4839c6fcbfa35b3526';
function updateOneMonthAhead(){
  var seriesId = 'JLNUM1M';
  var risk=0;
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CrashAlert");
  var url = "https://api.stlouisfed.org/fred/series/observations?series_id=" 
             + seriesId + "&api_key=" + FREDKEY + "&file_type=json&sort_order=desc&limit=1";
  try {
        var response = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
        var data = JSON.parse(response.getContentText());
        
        if (!data.observations || data.observations.length === 0) {
            throw new Error("No observations found for series ID: " + seriesId);
        }

        // 1. Extract Raw Value
        var rawValue = parseFloat(data.observations[0].value);
        if (isNaN(rawValue)) {
            throw new Error("Raw value is not a valid number: " + data.observations[0].value);
        }
        // 1. Extract Date Value
        var dateValue = parseFloat(data.observations[0].date);
        if (isNaN(rawValue)) {
            throw new Error("Raw date is not a valid date: " + data.observations[0].date);
        }
         sheet.getRange("H11").setValue("Updated: " + new Date().toLocaleString() + 
                                    " | FRED: $" + rawValue.toFixed(2) + "1MonthAhead" +
                                    " | Data: " + dateValue );
        Logger.log('Fetched ' + seriesId + ' Raw: ' + rawValue.toFixed(2) + dateValue.toLocaleString() );
        
         if (rawValue < 2.5) {
        risk = -1;  // Below Consumer pessimism
      } else if (rawValue < 5.0) {
        risk < 0;  // within normal boundaries
      } else {
        risk = 1; // High consumer pessimism
      }
    sheet.getRange("D11").setValue(rawValue);
    sheet.getRange("E11").setValue(risk);
    var riskLabel = risk === 1 ? "HIGH" : (risk === 0 ? "MODERATE" : "LOW");
    sheet.getRange("F11").setValue(riskLabel);
        return rawValue;
    } catch(e) {
        Logger.log('Error fetching FRED ' + seriesId + ': ' + e.toString());
        // Return 0 on failure
        return 0;
    }
    
}

var Cache = {
  set: function (key, value) {
    PropertiesService.getScriptProperties().setProperty(key, JSON.stringify({
      timestamp: Date.now(),
      value: value
    }));
  },

  get: function (key, maxAgeMs) {
    var raw = PropertiesService.getScriptProperties().getProperty(key);
    if (!raw) return null;

    try {
      var obj = JSON.parse(raw);
      if (Date.now() - obj.timestamp > maxAgeMs) return null;
      return obj.value;
    } catch (e) {
      return null;
    }
  },

  getLKG: function (key) {
    var raw = PropertiesService.getScriptProperties().getProperty(key);
    if (!raw) return null;

    try {
      return JSON.parse(raw).value;
    } catch (e) {
      return null;
    }
  }
};

function getFredSPYPrice() {
  try {
    var fredKey = "0660086ceb0adf4839c6fcbfa35b3526";
    var url = "https://api.stlouisfed.org/fred/series/observations?series_id=SP500&api_key=" +
              fredKey + "&file_type=json&sort_order=desc&limit=1";

    var resp = UrlFetchApp.fetch(url);
    var data = JSON.parse(resp.getContentText());

    var spx = parseFloat(data.observations[0].value);
    if (isNaN(spx)) throw new Error("Invalid SPX");

    // SPY ≈ SPX / 10
    return spx / 10;

  } catch (e) {
    Logger.log("FRED fallback failed: " + e);
    return null;
  }
}



function getSPYPriceResilient(client) {
  var CACHE_KEY = "SPY_PRICE";
  var MAX_AGE = 5 * 60 * 1000; // 5 minutes

  // 1. Try cache first
  var cached = Cache.get(CACHE_KEY, MAX_AGE);
  if (cached) return cached;

  // 2. Try Alpha Vantage
  try {
    var quote = client.getGlobalQuote("SPY");
    var price = quote.price;
    Cache.set(CACHE_KEY, price);
    return price;
  } catch (e) {
    Logger.log("Alpha Vantage price failed: " + e);
  }

  // 3. Try FRED fallback
  var fredPrice = getFredSPYPrice();
  if (fredPrice) {
    Cache.set(CACHE_KEY, fredPrice);
    return fredPrice;
  }

  // 4. Last Known Good Value
  var lkg = Cache.getLKG(CACHE_KEY);
  if (lkg) {
    Logger.log("Using LKG SPY price: " + lkg);
    return lkg;
  }

  throw new Error("No SPY price available from any source.");
}

function getSMAsResilient(client) {
  var CACHE_KEY = "SPY_SMAS";
  var MAX_AGE = 10 * 60 * 1000; // 10 minutes

  // 1. Cache first
  var cached = Cache.get(CACHE_KEY, MAX_AGE);
  if (cached) return cached;

  // 2. Try Alpha Vantage (daily, adjusted, weekly, monthly)
  try {
    var closes = client.getDailyCloses("SPY", 200);
    var sma50 = average(closes.slice(0, 50));
    var sma200 = average(closes.slice(0, 200));

    var result = { sma50: sma50, sma200: sma200 };
    Cache.set(CACHE_KEY, result);
    return result;

  } catch (e) {
    Logger.log("Alpha Vantage SMA failed: " + e);
  }

  // 3. Last Known Good Value
  var lkg = Cache.getLKG(CACHE_KEY);
  if (lkg) {
    Logger.log("Using LKG SMAs");
    return lkg;
  }

  throw new Error("No SMA data available from any source.");
}


function updateMarketMode() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("CrashAlert");
  var client = new AlphaVantageClient("BL1KL3HFI4C31SPD");

  try {
    var price = getSPYPriceResilient(client);
    var smas = getSMAsResilient(client);

    var sma50 = smas.sma50;
    var sma200 = smas.sma200;

    var bull = 0, bear = 0;

    if (price > sma200) bull += 2; else bear += 2;
    if (price > sma50) bull += 1; else bear += 1;
    if (sma50 > sma200) bull += 1; else bear += 1;

    var mode = bull > bear ? "BULL" :
               bear > bull ? "BEAR" : "NEUTRAL";

    sheet.getRange("B15").setValue(mode);

    sheet.getRange("H15").setValue(
      "Updated: " + new Date().toLocaleString() +
      " | Price: " + price.toFixed(2) +
      " | SMA50: " + sma50.toFixed(2) +
      " | SMA200: " + sma200.toFixed(2)
    );

  } catch (e) {
    sheet.getRange("B15").setValue("API ERROR");
    Logger.log("Market Mode Error: " + e);
  }
}











