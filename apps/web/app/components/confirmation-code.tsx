import { useState } from "react"
import { ConfirmationCodeInput } from "./confirmation-code-input"
import styles from './confirmation-code.module.css'

export interface SubmittedEmailProps {
  submittedEmail: string
}


export const ConfirmationCode = ({ submittedEmail }: SubmittedEmailProps) => {
  const [successConfirmEmail, setSuccessConfirmEmail] = useState(false)

  return (
    <div className={styles.sectionWrapper}>
      <div className={styles.titleWrapper}>
        <h1>Check Your Email for a Code</h1>
        <span>We've sent a 6-character code to <span style={{fontWeight: 'bold'}}>{submittedEmail}</span></span>
      </div>
      <ConfirmationCodeInput submittedEmail={submittedEmail} onSuccess={() => setSuccessConfirmEmail(true)}/>
    </div>
  )
}