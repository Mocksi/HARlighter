import type { ModificationRequest } from "./interfaces";
import { generateModifications, parseRequest } from "./utils";

export async function modifyHtml(
	htmlString: string,
	userRequest: string,
): Promise<string> {
	const parser = new DOMParser();
	const doc = parser.parseFromString(htmlString, "text/html");

	const modificationRequest: ModificationRequest = parseRequest(userRequest);

	await generateModifications(modificationRequest, doc);

	const serializer = new XMLSerializer();
	return serializer.serializeToString(doc);
}
