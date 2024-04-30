// biome-ignore lint/style/useImportType: it's ok
import React,{useState, useEffect } from "react";
import { Button } from "@chakra-ui/react";
import { on } from "events";

const MOCKSI_RECORDING_STATE = "mocksi-recordingState";
interface RecordButtonProps {
  onRecordChange: (isRecording: boolean) => void;
}

const RecordButton: React.FC<RecordButtonProps> = ({
  onRecordChange,
}) => {

  const [isRecording, setIsRecording] = useState(null);

  useEffect(() => {
    if (localStorage.getItem(MOCKSI_RECORDING_STATE) === "true") {
      setIsRecording(true);
      return
    }
    localStorage.setItem(MOCKSI_RECORDING_STATE, "false"); 
    setIsRecording(false);
  }, []);

  onRecordChange(isRecording);

  const handleToggleRecording = () => {
    const newRecordingState = !isRecording;
    onRecordChange(newRecordingState);
    setIsRecording(newRecordingState);
    localStorage.setItem(MOCKSI_RECORDING_STATE, newRecordingState.toString()); 
  };

  const label = isRecording ? "stop" : "start";
  const colorScheme = isRecording ? "red" : "green";

  if (isRecording === null) {
    return null;
  }

  return (
    <Button colorScheme={colorScheme} onClick={handleToggleRecording}>
      {label}
    </Button>
  );
};

export default RecordButton;
