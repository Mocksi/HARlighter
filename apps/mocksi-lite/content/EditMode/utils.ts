export const applyStyles = (element: HTMLElement, styles: Record<string, string>) => {
	for (const [key, value] of Object.entries(styles)) {
		element.style.setProperty(key, value);
	}
}