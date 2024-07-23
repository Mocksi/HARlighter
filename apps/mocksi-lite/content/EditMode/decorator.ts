import { applyChanges, cancelEditWithoutChanges } from "./actions";
import { applyStyles } from "./utils";

// function to decorate the portion of TextNode with the textArea to edit the content
// functions parameter is to add some extra functionality at the moment of submitting or cancel.
export function decorate(
	text: string,
	width: string,
	shiftMode: boolean,
	functions: {
		onSubmit: (() => void) | undefined;
		onCancel: (() => void) | undefined;
	} = { onSubmit: undefined, onCancel: undefined },
) {
	const newSpan = document.createElement("span");
	newSpan.style.position = "relative";
	newSpan.id = "mocksiSelectedText";
	newSpan.appendChild(document.createTextNode(text));
	const textArea = injectTextArea(
		shiftMode ? width : undefined,
		text,
		functions.onSubmit,
		functions.onCancel,
	);
	newSpan.appendChild(textArea);
	return newSpan;
}

function injectTextArea(
	width: string | undefined,
	value: string,
	onSubmit?: () => void,
	onCancel?: () => void,
) {
	const ndiv = document.createElement("textarea");
	ndiv.setAttribute("tabindex", "-1");

	const padding = "5px";
	const elementStyle = {
		width: `calc(120% + ${padding})`, // TODO: Make this dynamic based off the length of the content
		height: `calc(100% + ${padding} + ${padding})`,
		border: "1px solid #33B8EA",
		padding: padding,
		borderRadius: "2px",
		position: "absolute",
		top: `-${padding}`,
		left: `-${padding}`,
		zIndex: "999",
		background: "#FFFFFF",
		resize: "none",
	};
	applyStyles(ndiv, elementStyle);

	ndiv.onkeydown = (event: KeyboardEvent) => {
		if (event.key === "Enter" && !event.shiftKey) {
			if (!event.repeat) {
				const newEvent = new Event("submit", { cancelable: true });
				event.target?.dispatchEvent(newEvent);
			}
			event.preventDefault(); // Prevents the addition of a new line in the text field
		} else if (event.key === "Escape") {
			onCancel?.();
			cancelEditWithoutChanges(document.getElementById("mocksiSelectedText"));
		}
	};
	ndiv.onsubmit = (event: SubmitEvent) => {
		const selectedText = document.getElementById("mocksiSelectedText");
		// @ts-ignore I don't know why the value property is no inside the target object
		const newValue = event.target?.value;
		onSubmit?.();
		applyChanges(selectedText, newValue, value);
	};

	//@ts-ignore
	ndiv.value = value;
	ndiv.id = "mocksiTextArea";
	ndiv.autofocus = true;
	return ndiv;
}
