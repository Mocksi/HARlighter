import { throws } from "assert";
const cssSelector = require("css-selector-generator");
import type {
	AppliedModifications,
	Modification,
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
