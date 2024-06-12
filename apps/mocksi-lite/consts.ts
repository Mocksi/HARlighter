export const MOCKSI_RECORDING_STATE = "mocksi-recordingState";
export const MOCKSI_MODIFICATIONS = "mocksi-modifications";
export const COOKIE_NAME = "sessionid";
export const MOCKSI_ACCESS_TOKEN = "mocksi-accessToken";
export const MOCKSI_USER_ID = "mocksi-userId";
export const MOCKSI_SESSION_ID = "mocksi-sessionId"; // FIXME: Move to an environment variable
export const STORAGE_CHANGE_EVENT = "MOCKSI_STORAGE_CHANGE";
export const MOCKSI_AUTH = "mocksi-auth"

export const WebSocketURL = "wss://crowllectordb.onrender.com/ws";
// FIXME: Move to an environment variable
export const SignupURL = "https://nest-auth-ts-merge.onrender.com";

export enum RecordingState {
	UNAUTHORIZED = "UNAUTHORIZED",
	READY = "READY",
	RECORDING = "RECORDING",
	ANALYZING = "ANALYZING",
	CREATE = "CREATE",
	EDITING = "EDITING",
}

export const popupTitle = "Tip & Tricks";

export const popupContent = [
	{
		title: "Only One Recording",
		text: "You can only make one recording right now, so make sure to capture everything you want to show off",
	},
	{
		title: "Editing Restrictions",
		text: "For V1, you can only change names, places, and other text on the final page of the recording. Ensure you end on the most important page to edit.",
	},
];
