import LeftSection from "./components/left-section";
import { RightSection } from "./components/right-section";
import { SignIn } from "./components/sign-in";
import styles from "./page.module.css";

export default function Page(): JSX.Element {

  return (
    <main className={styles.main}>
      <LeftSection />
      <RightSection>
        <SignIn />
      </RightSection>
    </main>
  );
}
