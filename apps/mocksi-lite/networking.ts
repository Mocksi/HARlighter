import auth0 from "auth0-js";
import MocksiRollbar from "./MocksiRollbar";
import { API_URL, MOCKSI_AUTH, MOCKSI_RECORDING_STATE } from "./consts";
import { AppState } from "./content/AppStateContext";
import { storage } from "./content/utils/Storage";

type HttpMethod = "GET" | "PUT" | "POST" | "DELETE";

interface ApiError extends Error {
	response?: Response;
	// TODO: type the data object
	// biome-ignore lint/suspicious/noExplicitAny: we haven't defined the type of body yet
	data?: any;
}

const auth0Client = new auth0.WebAuth({
	domain: "dev-3lgt71qosvm4psf0.us.auth0.com",
	clientID: "3XDxVDUz3W3038KmRvkJSjkIs5mGj7at",
});

const getAuthToken = async (): Promise<string> => {
	try {
		const storageAuth = await chrome.storage.local.get(MOCKSI_AUTH);
		const mocksiAuth = JSON.parse(storageAuth[MOCKSI_AUTH]);
		return mocksiAuth.accessToken ?? "";
	} catch (err) {
		MocksiRollbar.error(`Failed to retrieve auth token: ${err}`);
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
	// biome-ignore lint/suspicious/noExplicitAny: we haven't defined the type of the response yet
): Promise<any> => {
	const makeRequest = async (token: string) => {
		const options: RequestInit = {
			method,
			headers: {
				"Content-Type": "application/json",
				"Accepts-Version": "v1",
				Authorization: `Bearer ${token}`,
			},
		};

		if (body && (method === "POST" || method === "PUT")) {
			options.body = JSON.stringify(body);
		}

		const response = await fetch(`${API_URL}/v1/${url}`, options);

		if (!response.ok) {
			if (response.status === 401) {
				await storage.setItem({
					[MOCKSI_RECORDING_STATE]: AppState.UNAUTHORIZED,
				});
				throw new Error("Unauthorized");
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return handleApiResponse(response);
	};

	try {
		const token = await getAuthToken();
		return await makeRequest(token);
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		MocksiRollbar.error("API call failed: ", errorMessage);
		throw new Error(`API call failed: ${errorMessage}`);
	}
};
