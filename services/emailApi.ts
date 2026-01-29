
import { EMAIL_SERVICE_URL } from '../constants';

interface EmailPayload {
    to: string;
    subject: string;
    body: string;
    attachmentBase64: string; // Data URI or Base64 string
    filename: string;
}

interface EmailResponse {
    status: 'success' | 'error';
    message?: string;
    data?: any;
}

/**
 * Sends a document via the dedicated Email Service App Script.
 */
export const sendDocumentEmail = async (payload: EmailPayload): Promise<EmailResponse> => {
    if (!EMAIL_SERVICE_URL || EMAIL_SERVICE_URL.includes('PLACEHOLDER')) {
        console.error("Email Service URL is not configured in constants.ts");
        return { status: 'error', message: "Email service not configured." };
    }

    try {
        const response = await fetch(EMAIL_SERVICE_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify({
                action: 'SEND_DOCUMENT',
                payload: payload
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const result: EmailResponse = await response.json();
        return result;

    } catch (error: any) {
        console.error("Email Service Error:", error);
        return { status: 'error', message: error.message || "Failed to send email." };
    }
};

/**
 * Sends a welcome email to a new customer (Lead).
 */
export const sendWelcomeEmail = async (to: string, customerName: string): Promise<EmailResponse> => {
    if (!EMAIL_SERVICE_URL || EMAIL_SERVICE_URL.includes('PLACEHOLDER')) {
        console.warn("Email Service URL not configured, skipping welcome email.");
        return { status: 'error', message: "Email service not configured." };
    }

    try {
        const response = await fetch(EMAIL_SERVICE_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify({
                action: 'SEND_WELCOME',
                payload: { to, customerName }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const result: EmailResponse = await response.json();
        return result;

    } catch (error: any) {
        console.error("Welcome Email Error:", error);
        return { status: 'error', message: error.message || "Failed to send welcome email." };
    }
};

/**
 * Sends account credentials to a new Company Admin.
 */
export const sendAccountCreationEmail = async (
    to: string, 
    companyName: string, 
    username: string, 
    password: string, 
    crewPin: string
): Promise<EmailResponse> => {
    if (!EMAIL_SERVICE_URL || EMAIL_SERVICE_URL.includes('PLACEHOLDER')) {
        return { status: 'error', message: "Email service not configured." };
    }

    try {
        const response = await fetch(EMAIL_SERVICE_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            },
            body: JSON.stringify({
                action: 'SEND_ACCOUNT_CREATION',
                payload: { to, companyName, username, password, crewPin }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const result: EmailResponse = await response.json();
        return result;

    } catch (error: any) {
        console.error("Account Creation Email Error:", error);
        return { status: 'error', message: error.message || "Failed to send account email." };
    }
};
