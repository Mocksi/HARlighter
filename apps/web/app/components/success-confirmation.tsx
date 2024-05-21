import styles from './success-confirmation.module.css'
export const SuccessConfirming = () => {
  return (
    <div className={styles.successWrapper}>
      <div className={styles.successTitleWrapper}>
        <h1>Success</h1>
        <span>Your Chrome Extension is now logged in.</span>
      </div>
      <span>Now go to your products homepage to start recording...</span>
    </div>
  )
}
