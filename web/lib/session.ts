
export async function sign(text: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(text)
    );
    // Convert buffer to hex string
    return text + '.' + Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verify(token: string, secret: string): Promise<string | null> {
    const lastDotIndex = token.lastIndexOf('.');
    if (lastDotIndex === -1) return null;

    const text = token.substring(0, lastDotIndex);
    const providedSignature = token.substring(lastDotIndex + 1);

    // Re-sign the text to compare signatures
    const expectedToken = await sign(text, secret);
    const expectedSignature = expectedToken.substring(lastDotIndex + 1);

    if (providedSignature === expectedSignature) {
        return text;
    }
    return null;
}

export function getSecret(): string {
    return process.env.AUTH_SECRET || process.env.STRIPE_SECRET_KEY || 'fallback-secret-DoNotUseInProd';
}
