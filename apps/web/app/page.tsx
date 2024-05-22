import LeftSection from "./components/left-section";
import { RightSection } from "./components/right-section";
import { SignIn } from "./components/sign-in";
import styles from "./page.module.css";
import { GoogleOAuthProvider } from '@react-oauth/google';

export default function Page(): JSX.Element {

  return (
    <main className={styles.main}>
      <GoogleOAuthProvider clientId="">
        <LeftSection />
        <RightSection>
          <SignIn />
        </RightSection>
      </GoogleOAuthProvider>
    </main>
  );
}
