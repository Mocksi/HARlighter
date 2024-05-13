import { Input } from "@repo/ui/input"
import styles from './confirmation-code-input.module.css'
import { useEffect, useRef, useState } from "react"

export const ConfirmationCodeInput = () => {
  const [code, setCode] = useState<(string | null)[]>([null, null, null, null, null, null])
  const [focusedInputIndex, setFocusedInputIndex] = useState<number>(0)
  const focusedInputRef = useRef<HTMLElement>()

  const onChangedValue = (value: string | null, index: number) => {
    setCode((prevValue) => {
      prevValue[index] = value || null
      return [...prevValue]
    })
    if (index < 5) {
      value && setFocusedInputIndex(index + 1)
    } else {
      // submit code if all inputs are filled
    }
  }
  
  const onPastedValue = (pastedValue: string) => {
    const pastedCode: string[] = pastedValue.split('')
    setCode(code.map((_, index) => pastedCode[index] || null))
  }

  useEffect(() => {
    focusedInputRef.current?.focus()
  }, [focusedInputIndex])

  return (
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
  )
}