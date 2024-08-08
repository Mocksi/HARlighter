import { type Dispatch, createContext, useEffect, useReducer } from "react";
import type { Recording } from "../background";
import {
	MOCKSI_ALTERATIONS,
	MOCKSI_RECORDING_CREATED_AT,
	MOCKSI_RECORDING_ID,
	MOCKSI_RECORDING_STATE,
} from "../consts";
import { loadAlterations, sendMessage } from "../utils";

export enum AppState {
	INIT = "INIT",
	UNAUTHORIZED = "UNAUTHORIZED",
	READYTORECORD = "READYTORECORD",
	RECORDING = "RECORDING",
	ANALYZING = "ANALYZING",
	LIST = "LIST",
	CREATE = "CREATE",
	SETTINGS = "SETTINGS",
	EDITING = "EDITING",
	PLAY = "PLAY",
	HIDDEN = "HIDDEN",
	CHAT = "CHAT",
}

export enum AppEvent {
	SET_INITIAL_STATE = "SET_INITIAL_STATE",
	START_RECORDING = "START_RECORDING",
	STOP_RECORDING = "STOP_RECORDING",
	STOP_ANALYZING = "STOP_ANALYZING",
	START_EDITING = "START_EDITING",
	CANCEL_EDITING = "CANCEL_EDITING",
	SAVE_MODIFICATIONS = "SAVE_MODIFICATIONS",
	START_PLAYING = "START_PLAYING",
	STOP_PLAYING = "STOP_PLAYING",
	START_CHAT = "START_CHAT",
	CREATE_DEMO = "CREATE_DEMO",
	SAVE_DEMO = "SAVE_DEMO",
	DISCARD_DEMO = "DISCARD_DEMO",
	ENTER_SETTINGS = "ENTER_SETTINGS",
	EXIT_SETTINGS = "EXIT_SETTINGS",
}

export const INITIAL_STATE = AppState.INIT;

type AppStateContextType = {
	state: AppState;
	dispatch: Dispatch<AppStateAction>;
};

type AppStateAction = {
	event: AppEvent;
	payload?: AppState;
};

export const AppStateContext = createContext<AppStateContextType>({
	state: INITIAL_STATE,
	dispatch: () => null,
});

const appStateReducer = (state: AppState, action: AppStateAction) => {
	switch (action.event) {
		case AppEvent.SET_INITIAL_STATE:
			return action.payload ?? AppState.LIST;
		case AppEvent.START_RECORDING:
			return AppState.RECORDING;
		case AppEvent.STOP_RECORDING:
			return AppState.ANALYZING;
		case AppEvent.STOP_ANALYZING:
			return AppState.LIST;
		case AppEvent.START_EDITING:
			return AppState.EDITING;
		case AppEvent.CANCEL_EDITING:
			return AppState.LIST;
		case AppEvent.SAVE_MODIFICATIONS:
			return AppState.LIST;
		case AppEvent.START_PLAYING:
			return AppState.PLAY;
		case AppEvent.STOP_PLAYING:
			return AppState.LIST;
		case AppEvent.START_CHAT:
			return AppState.CHAT;
		case AppEvent.CREATE_DEMO:
			return AppState.CREATE;
		case AppEvent.SAVE_DEMO:
			return AppState.LIST;
		case AppEvent.DISCARD_DEMO:
			return AppState.LIST;
		case AppEvent.ENTER_SETTINGS:
			return AppState.SETTINGS;
		case AppEvent.EXIT_SETTINGS:
			return AppState.LIST;
		default:
			return state;
	}
};

/**
 * Wraps the reducer and takes the state change and saves it to chrome local storage
 * @param reducer the app state reducer that we want to use to calc the next state
 * @returns the next app state
 */
const localStorageMiddleware = (reducer: typeof appStateReducer) => {
	return (state: AppState, action: AppStateAction) => {
		const newState = reducer(state, action);

		console.log(state, action.event, newState);

		chrome.storage.local.set({ [MOCKSI_RECORDING_STATE]: newState });

		return newState;
	};
};

export const AppStateProvider: React.FC<{
	children: React.ReactNode;
	initialRecordings?: Recording[];
}> = ({ children, initialRecordings }) => {
	const reducer = localStorageMiddleware(appStateReducer);
	const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

	// Load the initial state from chrome storage on mount
	useEffect(() => {
		chrome.storage.local.get(
			[
				MOCKSI_RECORDING_STATE,
				MOCKSI_ALTERATIONS,
				MOCKSI_RECORDING_ID,
				MOCKSI_RECORDING_CREATED_AT,
			],
			(result) => {
				if (result[MOCKSI_RECORDING_STATE] === AppState.UNAUTHORIZED) {
					dispatch({
						event: AppEvent.SET_INITIAL_STATE,
						payload: AppState.UNAUTHORIZED,
					});
					return;
				}

				if (result[MOCKSI_RECORDING_STATE] === AppState.PLAY) {
					dispatch({
						event: AppEvent.SET_INITIAL_STATE,
						payload: AppState.PLAY,
					});
					sendMessage("updateToPauseIcon");

					return;
				}

				if (result[MOCKSI_RECORDING_STATE] === AppState.EDITING) {
					dispatch({
						event: AppEvent.SET_INITIAL_STATE,
						payload: AppState.EDITING,
					});
					sendMessage("attachDebugger");

					return;
				}

				console.log({ initialRecordings });

				if (
					initialRecordings?.length &&
					initialRecordings.some(
						(rec: Recording) => rec.url === window.location.href,
					)
				) {
					dispatch({
						event: AppEvent.SET_INITIAL_STATE,
						payload: result[MOCKSI_RECORDING_STATE],
					});
				} else {
					dispatch({
						event: AppEvent.SET_INITIAL_STATE,
						payload: AppState.READYTORECORD,
					});
				}
			},
		);
	}, [initialRecordings]);

	const value = {
		state,
		dispatch,
	};

	return (
		<AppStateContext.Provider value={value}>
			{children}
		</AppStateContext.Provider>
	);
};
