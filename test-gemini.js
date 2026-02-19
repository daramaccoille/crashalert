
const https = require('https');

// Use env var or fallback (for test)
const API_KEY = process.env.GEMINI_KEY ;

async function testModel(modelName) {
    console.log(`\n--- Testing Model: ${modelName} ---`);
    const data = JSON.stringify({
        contents: [{
            parts: [{ text: "Explain how AI works in a few words" }]
        }]
    });

    const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/${modelName}:generateContent?key=${API_KEY}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log("✅ SUCCESS!");
                    try {
                        const json = JSON.parse(body);
                        console.log("Response:", json.candidates[0].content.parts[0].text.trim());
                    } catch (e) {
                        console.log("Raw Body:", body);
                    }
                } else {
                    console.error(`❌ FAILED (Status: ${res.statusCode})`);
                    console.error("Error Body:", body);
                }
                resolve();
            });
        });

        req.on('error', (error) => {
            console.error(error);
            resolve();
        });

        req.write(data);
        req.end();
    });
}

async function run() {
    // 1. Test standard confirmed working model
    await testModel('gemini-1.5-flash');

    // 2. Test the one user tried (might be experimental/preview)
    await testModel('gemini-2.0-flash');
}

run();
