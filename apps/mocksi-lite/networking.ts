import { API_URL, MOCKSI_AUTH } from "./consts";

type HttpMethod = "GET" | "PUT" | "POST";

interface ApiError extends Error {
	response?: Response;
	// TODO: type the data object
	// biome-ignore lint/suspicious/noExplicitAny: we haven't defined the type of body yet
	data?: any;
}

const getAuthToken = async (): Promise<string> => {
	try {
		const storageAuth = await chrome.storage.local.get(MOCKSI_AUTH);
		const mocksiAuth = JSON.parse(storageAuth[MOCKSI_AUTH]);
		return mocksiAuth.accessToken ?? "";
	} catch (err) {
		console.error("Failed to retrieve auth token:", err);
		return "";
	}
};

// biome-ignore lint/suspicious/noExplicitAny: we haven't defined the type of body yet
const handleApiResponse = async (response: Response): Promise<any> => {
	const data = await response.json();
	if (response.ok) {
		return data;
	}
	const error: ApiError = new Error(
		`API call failed: ${
			data.error_description || data.error || "Unknown error"
		}`,
	);
	error.response = response;
	error.data = data;
	throw error;
};

export const apiCall = async (
	url: string,
	method: HttpMethod = "GET",
	// biome-ignore lint/suspicious/noExplicitAny: we haven't defined the type of body yet
	body?: any,
	// biome-ignore lint/suspicious/noExplicitAny: we haven't defined the type of body yet
): Promise<any> => {
	try {
		const token = await getAuthToken();

		const res = await fetch(`${API_URL}/v1/${url}`, {
			method,
			headers: {
				"Content-Type": "application/json",
				"Accepts-Version": "v1",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(body),
		});

		return await handleApiResponse(res);
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		throw new Error(`API call failed: ${errorMessage}`);
	}
};
