"use client"
import { useState } from "react"
import { SubmitEmail } from "./submit-email"

export const SignIn = () => {
  const [submittedEmail, setSubmittedEmail] = useState('')
  return submittedEmail ? 
    (<>HelloWorld</>) :
    (<SubmitEmail setSubmittedEmail={setSubmittedEmail}/>)
}