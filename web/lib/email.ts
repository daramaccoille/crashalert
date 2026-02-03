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
            console.error(`Brevo Email Failed to ${to}: ${response.status} - ${errorText}`);
            return { success: false, error: `${response.status} - ${errorText}` };
        }

        console.log(`Email sent successfully to ${to}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error sending email via Brevo:", error);
        return { success: false, error: error.message || String(error) };
    }
}
