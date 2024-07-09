import type { ModificationRequest } from "./interfaces";
import { generateModifications, parseRequest } from "./utils";

export async function modifyHtml(
	htmlString: string,
	userRequest: string,
): Promise<string> {
	try {
		const parser = new DOMParser();
		const doc = parser.parseFromString(htmlString, "text/html");

		const modificationRequest: ModificationRequest = parseRequest(userRequest);

		await generateModifications(modificationRequest, doc);

		const serializer = new XMLSerializer();
		return serializer.serializeToString(doc);
		// biome-ignore lint/suspicious/noExplicitAny: Exception handling
	} catch (e: any) {
		console.error("Error modifying HTML:", e);
		throw new Error(`Error modifying HTML: ${e}`);
	}
}
