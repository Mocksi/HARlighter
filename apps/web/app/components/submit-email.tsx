import { useState } from "react"
import { Input } from "@repo/ui/input"
import { Button } from "@repo/ui/button"
import { validateEmail } from "../utils"

interface SubmitEmailProps {
  setSubmittedEmail: (email: string) => void
}

export const SubmitEmail = ({ setSubmittedEmail }: SubmitEmailProps) => {
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')
  const submitSignIn = () => {
    if (validateEmail(inputValue)) {
      setSubmittedEmail(inputValue)
    } else {
      setSubmittedEmail('')
      setInputError('Sorry, but that email is invalid.')
    }
  }
  return (
    <>
      <Input
        onChange={(value) => {
          inputError && setInputError('')
          setInputValue(value)
        }}
        value={inputValue}
        inputLabel="Email Address"
        errorMessage={inputError}
      />
      <Button
        onClick={() => submitSignIn()}
      >Sign in with Email</Button>
    </>
  )
}