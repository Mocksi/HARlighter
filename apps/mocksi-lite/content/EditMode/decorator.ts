import { applyChanges, cancelEditWithoutChanges } from "./actions";

export function decorate(text: string, width: string, shiftMode: boolean) {
	const newSpan = document.createElement("span");
	newSpan.style.position = "relative";
	newSpan.id = "mocksiSelectedText";
	newSpan.appendChild(document.createTextNode(text));
	const textArea = injectTextArea(shiftMode ? width : undefined, text);
	newSpan.appendChild(textArea);
	return newSpan;
}

function injectTextArea(width: string | undefined, value: string) {
	const ndiv = document.createElement("textarea");
	ndiv.setAttribute("tabindex", "-1");
	const elementStyle = {
		width: width ? "120%" : "150%",
		height: "100%",
		border: "1px solid red",
		position: "absolute",
		top: "0",
		left: "0",
		zIndex: "999",
		background: "#f0f8ffa8",
	};
	ndiv.style.width = elementStyle.width;
	ndiv.style.height = elementStyle.height;
	ndiv.style.border = elementStyle.border;
	ndiv.style.position = elementStyle.position;
	ndiv.style.top = elementStyle.top;
	ndiv.style.left = elementStyle.left;
	ndiv.style.zIndex = elementStyle.zIndex;
	ndiv.style.background = elementStyle.background;
	ndiv.onkeydown = (event: KeyboardEvent) => {
		if (event.key === "Enter" && !event.shiftKey) {
			if (!event.repeat) {
				const newEvent = new Event("submit", { cancelable: true });
				event.target?.dispatchEvent(newEvent);
			}
			event.preventDefault(); // Prevents the addition of a new line in the text field
		} else if (event.key === "Escape") {
			cancelEditWithoutChanges(document.getElementById("mocksiSelectedText"));
		}
	};
	ndiv.onsubmit = (event: SubmitEvent) => {
		const selectedText = document.getElementById("mocksiSelectedText");
		// @ts-ignore I don't know why the value property is no inside the target object
		const newValue = event.target?.value;
		applyChanges(selectedText, newValue, value);
	};
	//@ts-ignore
	ndiv.value = value;
	ndiv.id = "mocksiTextArea";
	ndiv.autofocus = true;
	return ndiv;
}
