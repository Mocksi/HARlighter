import { useEffect, useState } from "react"
import { Input } from "@repo/ui/input"
import { Button } from "@repo/ui/button"
import { validateEmail } from "../utils"
import styles from './submit-email.module.css'
import { useCreateAccount } from "../hooks/createAccount"
import { useTimeout } from "../hooks/useTimeout"

interface SubmitEmailProps {
  setSubmittedEmail: (email: string) => void
}

export const SubmitEmail = ({ setSubmittedEmail }: SubmitEmailProps) => {
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')
  const runTimeoutFunction = useTimeout(() => setInputError(''))
  
  const { isLoading, callCreateAccount } = useCreateAccount(
    () => setSubmittedEmail(inputValue),
    () => {
      setSubmittedEmail('')
      // TODO better error showing for the user
      setInputError('Sorry, something happened')
      runTimeoutFunction()
    }
  )

  const submitSignIn = () => {
    if (validateEmail(inputValue)) {
      callCreateAccount(inputValue)
    } else {
      setSubmittedEmail('')
      setInputError('Sorry, but that email is invalid.')
      runTimeoutFunction()
    }
  }
  return (
    <>
      <Input
        onChange={({ target }) => {
          inputError && setInputError('')
          setInputValue(target.value)
        }}
        value={inputValue}
        inputLabel="Email Address"
        errorMessage={inputError}
      />
      <Button
        className={styles.button}
        onClick={() => submitSignIn()}
      >Sign in with Email</Button>
      {isLoading && <h2>Sending...</h2>}
    </>
  )
}