import auth0 from "auth0-js";
import { API_URL, MOCKSI_AUTH } from "./consts";

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
		console.error("Failed to retrieve auth token:", err);
		return "";
	}
};

const refreshToken = async (): Promise<string> => {
	return new Promise((resolve, reject) => {
		auth0Client.checkSession(
			{},
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
	// biome-ignore lint/suspicious/noExplicitAny: we haven't defined the type of body yet
): Promise<any> => {
	try {
		let token = await getAuthToken();

		let res = await fetch(`${API_URL}/v1/${url}`, {
			method,
			headers: {
				"Content-Type": "application/json",
				"Accepts-Version": "v1",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(body),
		});

		if (res.status === 401) {
			// Unauthorized, likely due to expired token
			token = await refreshToken();

			res = await fetch(`${API_URL}/v1/${url}`, {
				method,
				headers: {
					"Content-Type": "application/json",
					"Accepts-Version": "v1",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(body),
			});
		}

		return await handleApiResponse(res);
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		throw new Error(`API call failed: ${errorMessage}`);
	}
};
