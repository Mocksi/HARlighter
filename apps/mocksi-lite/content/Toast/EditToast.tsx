import { useCallback, useContext, useEffect, useState } from "react";
import type { Alteration } from "../../background";
import { CloseButton } from "../../common/Button";
import TextField from "../../common/TextField";
import {
	MOCKSI_ALTERATIONS,
	MOCKSI_READONLY_STATE,
	MOCKSI_RECORDING_ID,
} from "../../consts";
import {
	getAlterations,
	loadAlterations,
	loadPreviousModifications,
	persistModifications,
	recordingLabel,
	sendMessage,
	undoModifications,
} from "../../utils";
import { AppEvent, AppStateContext } from "../AppStateContext";
import { cancelEditWithoutChanges } from "../EditMode/actions";
import {
	applyEditor,
	applyReadOnlyMode,
	disableReadOnlyMode,
} from "../EditMode/editMode";
import { getHighlighter } from "../EditMode/highlighter";
import { buildQuerySelector } from "../EditMode/utils";
import IframeWrapper from "../IframeWrapper";
import Toast from "./index";

type EditToastProps = {
	initialReadOnlyState?: boolean;
};

export type ApplyAlteration = (
	element: HTMLElement,
	newText: string,
	cleanPattern: string,
	type: "text" | "image",
) => void;

const observeUrlChange = (onChange: () => void) => {
	let oldHref = document.location.href;
	const body = document.querySelector("body");

	if (!body) {
		console.error("body not found");
		return;
	}

	const observer = new MutationObserver((mutations) => {
		if (oldHref !== document.location.href) {
			oldHref = document.location.href;
			onChange();
		}
	});
	observer.observe(body, { childList: true, subtree: true });
};

const EditToast = ({ initialReadOnlyState }: EditToastProps) => {
	const { dispatch, state } = useContext(AppStateContext);

	const [areChangesHighlighted, setAreChangesHighlighted] = useState(true);
	const [isReadOnlyModeEnabled, setIsReadOnlyModeEnabled] = useState(
		initialReadOnlyState ?? true,
	);
	const [alterations, setAlterations] = useState<Alteration[]>([]);
	const [recordingId, setRecordingId] = useState<string | null>(null);
	const [url, setUrl] = useState<string>(document.location.href);

	// biome-ignore lint/correctness/useExhaustiveDependencies: only run this on mount
	useEffect(() => {
		// get alterations that were set in DemoItem.tsx and load them into state
		chrome.storage.local
			.get([MOCKSI_ALTERATIONS, MOCKSI_RECORDING_ID])
			.then((result) => {
				const recordingId = result[MOCKSI_RECORDING_ID];
				if (!recordingId) {
					console.error("no recording id found");
					return;
				}
				setRecordingId(recordingId);

				const storedAlterations = result[MOCKSI_ALTERATIONS];
				if (storedAlterations) {
					setAlterations(storedAlterations);
				}

				// TODO: would be nice if it was like loadAlterations(alterations, { withHighlights: true })
				loadAlterations(storedAlterations, {
					withHighlights: areChangesHighlighted,
				});

				setupEditor();
			})
			.catch((err) => {
				console.error("error fetching alterations", err);
			});
	}, []);

	// Each time the URL updates we want to remove the existing highlights, and reload the alterations onto the page
	// biome-ignore lint/correctness/useExhaustiveDependencies: we dont use the url but want to run this whenever it changes
	useEffect(() => {
		getHighlighter().removeHighlightNodes();
		loadAlterations(alterations, { withHighlights: areChangesHighlighted });
	}, [url]);

	const setupEditor = async () => {
		sendMessage("attachDebugger");

		// Whenever the url changes, we want to update the url in state which triggers the
		// use effect that removes the highlights and reloads the alterations
		observeUrlChange(() => {
			setUrl(document.location.href);
		});

		const results = await chrome.storage.local.get([MOCKSI_READONLY_STATE]);

		// If value exists and is true or if the value doesn't exist at all, apply read-only mode
		if (
			results[MOCKSI_READONLY_STATE] === undefined ||
			results[MOCKSI_READONLY_STATE]
		) {
			applyReadOnlyMode();
		}

		document.body.addEventListener("dblclick", onDoubleClickText);

		return;
	};

	const teardownEditor = async () => {
		sendMessage("detachDebugger");

		if (recordingId) {
			await persistModifications(recordingId, alterations);
		}

		undoModifications(alterations);
		cancelEditWithoutChanges(document.getElementById("mocksiSelectedText"));
		disableReadOnlyMode();

		await chrome.storage.local.remove([
			MOCKSI_RECORDING_ID,
			MOCKSI_READONLY_STATE,
			MOCKSI_ALTERATIONS,
		]);

		document.body.removeEventListener("dblclick", onDoubleClickText);
	};

	const resetEditor = async () => {
		sendMessage("detachDebugger");

		undoModifications(alterations);
		cancelEditWithoutChanges(document.getElementById("mocksiSelectedText"));
		disableReadOnlyMode();

		await chrome.storage.local.remove([
			MOCKSI_RECORDING_ID,
			MOCKSI_READONLY_STATE,
			MOCKSI_ALTERATIONS,
		]);

		document.body.removeEventListener("dblclick", onDoubleClickText);
	};

	const onDoubleClickText = useCallback((event: MouseEvent) => {
		// @ts-ignore MouseEvent typing seems incomplete
		const nodeName = event?.toElement?.nodeName;

		// if (nodeName === "IMG") {
		// 	const targetedElement: HTMLImageElement = event.target as HTMLImageElement;
		// 	console.log("Image clicked", targetedElement.alt);
		// 	// openImageUploadModal(targetedElement);
		// 	return;
		// }

		if (nodeName !== "TEXTAREA") {
			cancelEditWithoutChanges(document.getElementById("mocksiSelectedText"));

			const targetedElement: HTMLElement = event.target as HTMLElement;
			const selection = window.getSelection();

			// check to make sure that we actually have a string selected and we didn't just double click on an empty part of the page
			if (selection?.toString()?.trim()) {
				applyEditor(
					targetedElement,
					selection,
					event.shiftKey,
					applyAlteration,
				);
				document.getElementById("mocksiTextArea")?.focus();
			}
		}
	}, []);

	const applyAlteration: ApplyAlteration = (
		element,
		newText,
		cleanPattern,
		type,
	) => {
		setAlterations((previous: Alteration[]) => {
			const newUncommitted = [
				...previous,
				{
					selector: buildQuerySelector(element, newText),
					dom_after: newText,
					dom_before: cleanPattern,
					action: "",
					type: type,
				},
			];

			return newUncommitted;
		});
	};

	const ContentHighlighter = getHighlighter();

	const onChecked = () => {
		setAreChangesHighlighted((prevValue) => {
			ContentHighlighter.showHideHighlights(!prevValue);
			return !prevValue;
		});
	};

	const onReadOnlyChecked = () => {
		setIsReadOnlyModeEnabled((prevValue) => {
			const newVal = !prevValue;

			if (newVal) {
				applyReadOnlyMode();
			} else {
				disableReadOnlyMode();
			}

			return newVal;
		});
	};

	const handleSave = async () => {
		await teardownEditor();

		dispatch({ event: AppEvent.SAVE_MODIFICATIONS });
	};

	const handleCancel = () => {
		resetEditor();

		dispatch({ event: AppEvent.CANCEL_EDITING });
	};

	const iframeStyle = {
		border: "none",
		position: "relative",
		width: "355px",
		zIndex: 9999998,
	};

	return (
		<IframeWrapper style={iframeStyle}>
			<Toast
				className="mw-flex mw-flex-row mw-items-center mw-gap-6 mw-m-2 mw-p-3 min-w-64"
				id="mocksi-editor-toast"
			>
				<CloseButton onClick={handleCancel} />
				<div className="mw-flex mw-flex-col mw-gap-2">
					<TextField variant={"title"}>{recordingLabel(state)}</TextField>
					<div className="mw-flex mw-items-center mw-gap-2">
						<input
							checked={areChangesHighlighted}
							className="!rounded-lg mw-h-5 mw-w-5"
							onChange={() => onChecked()}
							type="checkbox"
						/>
						<div className="mw-text-[13px] leading-[15px]">
							Highlight All Previous Changes
						</div>
					</div>

					<div className="mw-flex mw-items-center mw-gap-2">
						<input
							checked={isReadOnlyModeEnabled}
							className="!rounded-lg mw-h-5 mw-w-5"
							onChange={() => onReadOnlyChecked()}
							type="checkbox"
						/>
						<div className="mw-text-[13px] leading-[15px]">
							{isReadOnlyModeEnabled ? "Disable" : "Enable"} Read-Only Mode
						</div>
					</div>
				</div>
				<div
					className="mw-text-[#009875] mw-cursor-pointer"
					onClick={async () => {
						handleSave();
					}}
					onKeyUp={async (event) => {
						if (event.key === "Enter") {
							handleSave();
						}
					}}
				>
					Done
				</div>
			</Toast>
		</IframeWrapper>
	);
};

export default EditToast;
function onDoubleClickText(this: HTMLElement, ev: MouseEvent) {
	throw new Error("Function not implemented.");
}
