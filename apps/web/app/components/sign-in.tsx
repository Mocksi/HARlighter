"use client"
import { useEffect, useState } from "react"
import { SubmitEmail } from "./submit-email"
import { ConfirmationCode } from "./confirmation-code"
import { useGetCookies } from "../hooks/createAccount"
import { SuccessConfirming } from "./success-confirmation"

export const SignIn = () => {
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | undefined>(undefined)
  const { getIsLoggedIn } = useGetCookies()

  useEffect(() => {
    setIsLoggedIn(getIsLoggedIn)
  }, [])
  
  if (isLoggedIn == undefined) return null
  return isLoggedIn ? <SuccessConfirming /> : (submittedEmail ? 
    (<ConfirmationCode submittedEmail={submittedEmail} />) :
    (<SubmitEmail setSubmittedEmail={setSubmittedEmail}/>))
}
