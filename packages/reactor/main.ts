import type {
	AppliedModifications,
	DomJsonExportNode,
	DomJsonExportOptions,
	ModificationRequest,
} from "./interfaces.js";
import { generateModifications } from "./modifications.js";
import { parseRequest } from "./utils.js";

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

export async function modifyDom(
	root: Document,
	modificationRequest: ModificationRequest,
): Promise<AppliedModifications> {
	try {
		return generateModifications(modificationRequest, root);
	} catch (e) {
		console.error("Error modifying DOM:", e);
		throw new Error(`Error modifying DOM: ${e}`);
	}
}

export const htmlElementToJson = (root: HTMLElement, options?: DomJsonExportOptions): DomJsonExportNode[] => {
	const stylesMap: {[key: string]: string} = {};
	const styleIndex: { idx: number } = { idx: 1 };
	const exportStyles = options?.styles ?? false;

	function nodeToJson(node: Node): DomJsonExportNode {
		if (node instanceof Text) {
			return {
				tag: "text",
				visible: node.parentElement
					? node.parentElement.offsetWidth > 0 ||
						node.parentElement.offsetHeight > 0
					: false,
				text: node.data,
				attributes: {}
			};
		}

		if (node instanceof Element) {
			const element = node;
			const obj: DomJsonExportNode = {
				tag: element.tagName.toLowerCase(),
				visible:
					element instanceof HTMLElement
						? element.offsetWidth > 0 || element.offsetHeight > 0
						: false,
				attributes: {},
			};

			if (element.attributes.length > 0) {
				for (const attr of Array.from(element.attributes)) {
					obj.attributes[attr.name] = attr.value;
				}
			}

			if (exportStyles) {
				const styles = window.getComputedStyle(element);
				if (styles.length > 0) {
					const styleString = Array.from(styles)
						.map((style) => `${style}: ${styles.getPropertyValue(style)}`)
						.join('; ');
					let styleClass = stylesMap[styleString];
					if (!styleClass) {
						styleClass = `mocksi-${styleIndex.idx}`;
						stylesMap[styleString] = styleClass;
						styleIndex.idx += 1;
					}

					if (obj.attributes['class']) {
						obj.attributes['class'] += ' ' + styleClass;
					} else {
						obj.attributes['class'] = styleClass;
					}
				}
			}

			const children = Array.from(element.childNodes).filter(textElementFilter);

			// special case: if the element has only one child, and that child is a text node, then
			// include the text directly
			if (children.length === 1 && children[0] instanceof Text) {
				obj.text = children[0].data;
			} else {
				obj.children = children.map((child) => nodeToJson(child));
			}

			// remove text and children from script and style elements
			if (obj.tag === "script" || obj.tag === "style") {
				obj.text = undefined;
				obj.children = undefined;
			}

			// remove empty children
			if (obj.children?.length === 0) {
				obj.children = undefined;
			}

			return obj;
		}

		throw new Error("Unknown node type");
	}

	// Convert the body of the parsed document to JSON
	const json = Array.from(root.childNodes)
		.filter(textElementFilter)
		.map((child) => nodeToJson(child));

	if (exportStyles) {
		const stylesString = Object.entries(stylesMap).map(([styleString, clazz]) => `.${clazz} { ${styleString} }`).join('\n');
		json.push({
			tag: 'style',
			visible: false,
			text: stylesString,
			attributes: {}
		})
	}

	return json;
};

// TODO: may need to handle DOCUMENT_NODE also for iframes
const textElementFilter = (node: Node) => {
	if (node instanceof Element) {
		return true;
	}

	// filter out "empty" text nodes that only include whitespace
	if (node instanceof Text) {
		return node.data.trim().length > 0;
	}

	// ignore other nodes
	return false;
};
