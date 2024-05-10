import { Input } from "@repo/ui/input"
import styles from './confirmation-code.module.css'
import { useEffect, useRef, useState } from "react"

// TODO! Support code copy-paste please! 
export const ConfirmationCode = () => {
  const [code, setCode] = useState<(string | null)[]>([null, null, null, null, null, null])
  const [focusedInputIndex, setFocusedInputIndex] = useState<number>(0)
  const focusedInputRef = useRef<HTMLElement>()

  const onChangedValue = (value: string | null, index: number) => {
    setCode((prevValue) => {
      prevValue[index] = value || null
      return [...prevValue]
    })
    if (value) {
      if (index < 5) setFocusedInputIndex(index + 1)
      else {
        // submit code if all inputs are filled
      }
    }
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
            onChange={({ nativeEvent }) => onChangedValue(nativeEvent.data, index)} 
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