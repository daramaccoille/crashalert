export async function sendEmail(
    to: string,
    subject: string,
    htmlContent: string
): Promise<{ success: boolean; error?: string }> {
    const url = 'https://api.brevo.com/v3/smtp/email';
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
        console.error("BREVO_API_KEY is missing in environment variables");
        return { success: false, error: "Missing API Key" };
    }

    // Sender configuration
    const sender = {
        name: "CrashAlert",
        email: "noreply@crashalert.online"
    };

    const body = {
        sender: sender,
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent
    };

    try {
        console.log(`Attempting to send email to ${to} using Brevo...`);
        console.log(`API Key preview: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)} (Length: ${apiKey.length})`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Brevo Email API Error for ${to}: Status ${response.status}`);
            console.error(`Response Body: ${errorText}`);
            return { success: false, error: `${response.status} - ${errorText}` };
        }

        const data = await response.json();
        console.log(`Brevo Email Success for ${to}. MessageID: ${JSON.stringify(data)}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error sending email via Brevo:", error);
        return { success: false, error: error.message || String(error) };
    }
}
