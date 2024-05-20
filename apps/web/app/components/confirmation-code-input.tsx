import { useEffect, useRef, useState } from "react"
import { Input } from "@repo/ui/input"
import styles from './confirmation-code-input.module.css'
import { useConfirmAccount } from "../hooks/createAccount"
import { SubmittedEmailProps } from "./confirmation-code"
import { useTimeout } from "../hooks/useTimeout"

interface ConfirmationCodeProps extends SubmittedEmailProps {
  onSuccess: () => void
}

export const ConfirmationCodeInput = ({ submittedEmail, onSuccess }: ConfirmationCodeProps) => {
  const [code, setCode] = useState<(string | null)[]>([null, null, null, null, null, null])
  const [errorMessage, setErrorMessage] = useState('')
  const [focusedInputIndex, setFocusedInputIndex] = useState<number>(0)
  const focusedInputRef = useRef<HTMLElement>()
  const runTimeoutFunction = useTimeout(() => setErrorMessage(''))
  
  const { isLoading, callSendCode } = useConfirmAccount(
    () => onSuccess(),
    () => {
      setErrorMessage('Incorrect Code')
      runTimeoutFunction()
    }
  )

  const onChangedValue = (value: string | null, index: number) => {
    setCode((prevValue) => {
      prevValue[index] = value || null
      return [...prevValue]
    })
    if (index < 5) {
      value && setFocusedInputIndex(index + 1)
    } else {
      // submit code if all inputs are filled
      const codeToSend = code.map((valueCode, index) => index < 5 ? valueCode : value).join('')
      callSendCode(submittedEmail, codeToSend)
    }
  }
  
  const onPastedValue = (pastedValue: string) => {
    const pastedCode: string[] = pastedValue.split('')
    const codeToSend = code.map((_, index) => pastedCode[index] || null)
    setCode(codeToSend)
    callSendCode(submittedEmail, codeToSend.join(''))
  }

  useEffect(() => {
    focusedInputRef.current?.focus()
  }, [focusedInputIndex])

  return (
    <>
      <div className={styles.inputContainer}>
        {
          code.map((value, index) => (
            <Input 
              key={`input-${index}`}
              id={`input-${index}`} 
              ref={
                index == 0 ? focusedInputRef :
                  (focusedInputIndex == index ? focusedInputRef : null)
              } 
              value={value} 
              onChange={({ target, nativeEvent }) => {
                nativeEvent.inputType === "insertFromPaste" ? 
                  onPastedValue(target.value) :
                  onChangedValue(nativeEvent.data, index)
              }} 
              inputClassName={index == 0 ? 
                  styles.firstInput : (
                    index == 5 ? 
                      styles.lastInput : 
                      styles.middleInput
                    )
                }
            />
          ))
        }
      </div>
      {isLoading && <h2>Validating Code...</h2>}
      {errorMessage && <h3>{errorMessage}</h3>}
    </>
  )
}