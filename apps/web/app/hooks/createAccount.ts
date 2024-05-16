import { useState } from "react"
import { apiCall } from "../utils"

export const useCreateAccount = (
  onSuccess: () => void = () => undefined,
  onError: () => void = () => undefined
) => {
  const [isLoading, setIsLoading] = useState(false)

  const callCreateAccount = (email: string) => {
    setIsLoading(true)
    createWithEmailAccount(email)
      .then(() => {
        setIsLoading(false)
        onSuccess()
      })
      .catch(() => {
        setIsLoading(false)
        onError()
      })
  }

  return {
    isLoading,
    callCreateAccount
  }
}

const createWithEmailAccount = (email: string) => apiCall('auth/email/start', { email })


export const useConfirmAccount = (
  onSuccess: () => void = () => undefined,
  onError: () => void = () => undefined
) => {
  const [isLoading, setIsLoading] = useState(false)

  const callSendCode = (email: string, code: string) => {
    setIsLoading(true)
    sendCode(email, code)
      .then(() => {
        setIsLoading(false)
        onSuccess()
      })
      .catch(() => {
        setIsLoading(false)
        onError()
      })
  }

  return {
    isLoading,
    callSendCode
  }
}

const sendCode = (email: string, code: string) => apiCall('auth/email/complete', { email, code })