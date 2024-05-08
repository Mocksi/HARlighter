import LeftSection from "./left-section";
import styles from "./page.module.css";
import { Button } from "@repo/ui/button";

export default function Page(): JSX.Element {
  return (
    <main className={styles.main}>
      <LeftSection />
      <div className={styles.rightSection}>
        <Button appName="web" className={styles.button}>
          Click me!
        </Button>
      </div>

    </main>
  );
}
