import { ConfirmationCodeInput } from "./confirmation-code-input"
import styles from './confirmation-code.module.css'

export const ConfirmationCode = ({ submittedEmail }: {submittedEmail: string}) => {
  return (
    <div className={styles.sectionWrapper}>
      <div className={styles.titleWrapper}>
        <h1>Check Your Email for a Code</h1>
        <span>We've sent a 6-character code to <span style={{fontWeight: 'bold'}}>{submittedEmail}</span></span>
      </div>
      <ConfirmationCodeInput />
    </div>
  )
}