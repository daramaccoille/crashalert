export async function sendEmail(
    to: string,
    subject: string,
    htmlContent: string
): Promise<boolean> {
    const url = 'https://api.brevo.com/v3/smtp/email';
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
        console.error("BREVO_API_KEY is missing in environment variables");
        return false;
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
            return false;
        }

        console.log(`Email sent successfully to ${to}`);
        return true;
    } catch (error) {
        console.error("Error sending email via Brevo:", error);
        return false;
    }
}
