import styles from "./left-section.module.css"
import { titleFont } from "../fonts"
import Image from "next/image"
import mocksiIcon from "../images/mocksi-logo.png"
import develIcon from "../images/devel-icon.png"
import sandboxIcon from "../images/sandbox-icon.png"
import testingIcon from "../images/testing-icon.png"


export default function LeftSection(): JSX.Element {
  return (
    <div className={styles.wrapper}>
      <div className={styles.iconWrapper}>
        <Image src={mocksiIcon}
          alt="MocksiIcon"
        />
      </div>
      <div className={styles.textWrapper}>
        <h1 className={titleFont.className}>
          <span className={styles.title}>Start now with Mocksi</span>
        </h1>
        <h3 className={styles.subtitle}>Generate realistic, synthetic database environments. Drastically simplifying and improving how you create and maintain high quality data for:</h3>
        <div className={styles.itemsWrapper}>
          <div className={styles.itemWrapper}>
            <Image src={develIcon} alt="develIcon"/>
            <span>Development</span>
          </div>
          <div className={styles.itemWrapper}>
            <Image src={testingIcon} alt="testingIcon"/>
            <span>Testing</span>
          </div>
          <div className={styles.itemWrapper}>
            <Image src={sandboxIcon} alt="sandboxIcon"/>
            <span>API Sandboxes</span>
          </div>
        </div>
      </div>
    </div>
  )
}