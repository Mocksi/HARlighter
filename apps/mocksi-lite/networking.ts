import auth0 from "auth0-js";
import MocksiRollbar from "./MocksiRollbar";
import { API_URL, MOCKSI_AUTH, MOCKSI_RECORDING_STATE } from "./consts";
import { AppState } from "./content/AppStateContext";

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
		MocksiRollbar.log("Retrieved auth from storage:", storageAuth);
		const mocksiAuth = JSON.parse(storageAuth[MOCKSI_AUTH]);
		MocksiRollbar.log("Parsed auth token:", mocksiAuth.accessToken);
		return mocksiAuth.accessToken ?? "";
	} catch (err) {
		MocksiRollbar.error(`Failed to retrieve auth token: ${err}`);
		return "";
	}
};

const refreshToken = async (): Promise<string> => {
	return new Promise((resolve, reject) => {
		MocksiRollbar.log("Refreshing token");
		auth0Client.checkSession(
			{
				responseType: "token"
			},
			(err: auth0.Auth0Error | null, result: auth0.Auth0Result | undefined) => {
				if (err) {
					return reject(err);
				}
				if (!result || !result.accessToken) {
					const errorMessage = !result
						? "No result from checkSession"
						: "No access token in result";
					return reject(new Error(errorMessage));
				}

				const accessToken = result.accessToken;
				chrome.storage.local.set(
					{ [MOCKSI_AUTH]: JSON.stringify(result) },
					() => {
						resolve(accessToken);
					},
				);
			},
		);
	});
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
				await chrome.storage.local.set({
					[MOCKSI_RECORDING_STATE]: AppState.UNAUTHORIZED,
				});
				throw new Error("Unauthorized");
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return handleApiResponse(response);
	};

	try {
		let token = await getAuthToken();

		try {
			return await makeRequest(token);
		} catch (error) {
			// if (error instanceof Error && error.message === "Unauthorized") {
			// 	MocksiRollbar.log("Received 401 from API, refreshing token");
			// 	token = await refreshToken();
			// 	return await makeRequest(token);
			// }
			throw error;
		}
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		MocksiRollbar.error("API call failed: ", errorMessage);
		throw new Error(`API call failed: ${errorMessage}`);
	}
};
