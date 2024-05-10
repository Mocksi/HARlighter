"use client"
import { useState } from "react"
import { SubmitEmail } from "./submit-email"
import { ConfirmationCode } from "./confirmation-code"

export const SignIn = () => {
  const [submittedEmail, setSubmittedEmail] = useState('')
  return submittedEmail ? 
    (<ConfirmationCode submittedEmail={submittedEmail} />) :
    (<SubmitEmail setSubmittedEmail={setSubmittedEmail}/>)
}