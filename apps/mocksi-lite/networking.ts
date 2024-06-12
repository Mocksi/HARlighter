import {MOCKSI_AUTH} from "./consts";

const API_URL = "https://crowllectordb.onrender.com/api";

export const apiCall = async (
	url: string,
	method: "GET" | "PUT" | "POST" = "GET",
	// biome-ignore lint/suspicious/noExplicitAny: this is hard to type
	body?: any,
) => {
	try {
    const storageAuth = await chrome.storage.local.get(MOCKSI_AUTH);
    const mocksiAuth = JSON.parse(storageAuth[MOCKSI_AUTH]);

		const res = await fetch(`${API_URL}/v1/${url}`, {
			method,
			headers: {
				"Content-Type": "application/json",
				"Accepts-Version": "v1",
        Authorization: `Bearer ${mocksiAuth.accessToken ?? ""}`
			},
			body: JSON.stringify(body),
		});
		const response = await res.json();
		if (res.ok) {
			return response;
		}
		throw new Error(
			`API call failed: ${
				response.error_description || response.error || "Unknown error"
			}`,
		);
	} catch (err) {
		throw new Error(`API call failed: ${err ?? "Unknown error"}`);
	}
};
