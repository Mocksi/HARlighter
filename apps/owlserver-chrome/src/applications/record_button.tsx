import React, { useState, useEffect } from "react";
import { Button } from "@chakra-ui/react";
import { FaRecordVinyl, FaStopCircle } from "react-icons/fa";

interface RecordButtonProps {
  onRecordChange?: (isRecording: boolean) => void;
  initialState: boolean;
}

const RecordButton: React.FC<RecordButtonProps> = ({
  onRecordChange,
  initialState,
}) => {
  const [isRecording, setIsRecording] = useState(initialState);

  useEffect(() => {
    localStorage.setItem("recordingState", isRecording.toString()); // Save the recording state to local storage
    onRecordChange?.(isRecording); // Notify parent component if the recording state changes
  }, [isRecording, onRecordChange]);

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const label = isRecording ? "stop" : "start";
  const colorScheme = isRecording? "red" : "green";

  return (
    <Button colorScheme={colorScheme} onClick={handleToggleRecording}>
      {label}
    </Button>
  );
};

export default RecordButton;
