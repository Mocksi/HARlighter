import LeftSection from "./components/left-section";
import { RightSection } from "./components/right-section";
import styles from "./page.module.css";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";

export default function Page(): JSX.Element {
  return (
    <main className={styles.main}>
      <LeftSection />
      <RightSection>
        <Input 
          inputLabel="Email Address"
        />
        <Button>Sign In With Email</Button>
      </RightSection>
    </main>
  );
}
