import styles from './right-section.module.css'

interface RightSectionProps {
  children: React.ReactNode
}

export const RightSection = ({ children } : RightSectionProps) => {
  return (
    <div className={styles.rightSection}>
      <div className={styles.contentWrapper}>
        {children}
      </div>
    </div>
  )
}