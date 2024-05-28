export const MOCKSI_RECORDING_STATE = "mocksi-recordingState";
export const COOKIE_NAME = 'sessionid'

export enum RecordingState {
  UNAUTHORIZED = "UNAUTHORIZED",
  READY = "READY",
  RECORDING = "RECORDING",
  ANALYZING = "ANALYZING",
}

export const popupTitle = 'Tip & Tricks';

export const popupContent = [
  {
    title: 'Only One Recording',
    text: 'You can only make one recording right now, so make sure to capture everything you want to show off',
  },
  {
    title: 'Editing Restrictions',
    text: 'For V1, you can only change names, places, and other text on the final page of the recording. Ensure you end on the most important page to edit.',
  }
];
