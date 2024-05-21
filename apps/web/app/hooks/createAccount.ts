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
      .then((response) => {
        setIsLoading(false)
        manageCookies(`${response.token_type} ${response.access_token}`, response.expires_in)
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

// TODO test httpOnly, secure.
const manageCookies = (token: string, expires: number) => document.cookie = `sessionid=${token}; max-age=${expires}`