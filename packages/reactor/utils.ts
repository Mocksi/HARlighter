import type {
	ModificationRequest,
} from "./interfaces";

export function parseRequest(userRequest: string): ModificationRequest {
	try {
		return JSON.parse(userRequest);
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	} catch (error: any) {
		console.error("Error parsing user request:", error);
		throw new Error("Invalid user request format");
	}
}

export function generateRandomString(length: number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}