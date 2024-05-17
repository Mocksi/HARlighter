import { useState, useEffect } from "react"

interface RecordButtonProps {
  onRecordChange: (status: RecordingState) => void
}
const MOCKSI_RECORDING_STATE = "mocksi-recordingState";

export enum RecordingState {
  READY="READY", RECORDING="RECORDING", ANALYZING="ANALYZING"
}

const recordingColorAndLabel = (currentStatus: RecordingState) => {
  switch (currentStatus) {
    case RecordingState.READY: return {color: 'bg-green/95', label: 'Start'}
    case RecordingState.RECORDING: return {color: 'bg-crimson/95', label: 'Stop'}
    case RecordingState.ANALYZING: return {color: 'bg-orange/95', label: 'Analyzing'}
    default: return {color: 'bg-green/95', label: 'Start'}
  }
}

const nextRecordingState = (currentStatus: RecordingState) => {
  switch (currentStatus) {
    case RecordingState.READY: return RecordingState.RECORDING
    case RecordingState.RECORDING: return RecordingState.ANALYZING
    case RecordingState.ANALYZING: return RecordingState.READY
    default: return RecordingState.READY
  }
}

export const RecordButton = ({ onRecordChange }: RecordButtonProps) => {
  const [status, setStatus] = useState<RecordingState>(RecordingState.READY)

  useEffect(() => {
    const storageState = (localStorage.getItem(MOCKSI_RECORDING_STATE) as RecordingState) || RecordingState.READY
    setStatus(storageState)
    onRecordChange(storageState)
	}, []);
  
  const handleToggleRecording = () => {
    const newRecordState = nextRecordingState(status)
    onRecordChange(newRecordState)
    setStatus(newRecordState)
    localStorage.setItem(MOCKSI_RECORDING_STATE, newRecordState.toString())
  }

  const {color, label} = recordingColorAndLabel(status)
  return (
    <button className={`h-full w-[56px] border-r-2 text-center ${color} text-white`} 
      onClick={() => handleToggleRecording()}>
      {label}
    </button>
  )
}