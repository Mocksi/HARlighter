import {useEffect, useState} from "react";
import {MOCKSI_RECORDING_STATE, RecordingState} from "../consts";
import {setRootPosition} from "../utils";
import Popup from "./Popup";
import EditToast from "./Toast/EditToast";
import PlayToast from "./Toast/PlayToast";
import RecordingToast from "./Toast/RecordingToast";
import HiddenToast from "./Toast/HiddenToast";

interface ContentProps {
	isOpen?: boolean;
	email: string | null;
}

export default function ContentApp({ isOpen, email }: ContentProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(isOpen || false);
	const [state, setState] = useState<RecordingState>(
		RecordingState.UNAUTHORIZED,
	);

	useEffect(() => {
		// Load initial state from chrome storage
		chrome.storage.local.get([MOCKSI_RECORDING_STATE], (result) => {
			const initialState = result[
				MOCKSI_RECORDING_STATE
			] as RecordingState | null;
			setState(initialState ?? RecordingState.UNAUTHORIZED);
		});
	}, []);

	const onChangeState = (newState: RecordingState) => {
		setState(newState);
		setRootPosition(newState);
		chrome.storage.local.set({ [MOCKSI_RECORDING_STATE]: newState });
	};

	if (!isDialogOpen) {
		return null;
	}
	if (state === RecordingState.READY || state === RecordingState.CREATE) {
		return (
			<Popup
				state={state}
				close={() => setIsDialogOpen(false)}
				setState={onChangeState}
				email={email}
			/>
		);
	}

	if (state === RecordingState.EDITING) {
		return <EditToast state={state} onChangeState={onChangeState} />;
	}

	if (state === RecordingState.PLAY) {
		return (
			<PlayToast
				onChangeState={onChangeState}
				close={() => setIsDialogOpen(false)}
			/>
		);
	}

  if (state === RecordingState.HIDDEN) {
    return (
      <HiddenToast onChangeState={onChangeState} close={() => setIsDialogOpen(false)} />
    )
  }

	return (
		<RecordingToast
			close={() => setIsDialogOpen(false)}
			state={state}
			onChangeState={onChangeState}
		/>
	);
}
