import streamlit as st
import time



markdown_sample = """
Generating data for Gap\n\n Men,Jackets and Coats,Hooded Down Jacket,Navy\n Men,Jackets and Coats,Hooded Down Jacket,Blue\n Men,Jackets and Coats,Hooded Down Jacket,Khaki\n Men,Jackets and Coats,Hooded Down Jacket,Yellow\n Men,Jackets and Coats,Wool Coat,Beige\n Men,Jackets and Coats,Quilted Liner Jacket,Black\n Women,Skirts,Flared Midi Skirt,Burgundy\n Women,Skirts,Button Front Midi Skirt,Green\n Women,Skirts,Button Front Midi Skirt,Blue\n Women,Skirts,Button Front Midi Skirt,Gray\n Women,Skirts,Bodycon Skirt,Orange\n Women,Skirts,Suede A-Line Skirt,Navy\n Women,Skirts,Suede A-Line Skirt,Purple\n Women,Skirts,Laced Leather Skirt,Black\n Women,Skirts,Flared Skirt,Orange\n Women,Skirts,Skater Skirt,Brown\n Women,Skirts,Skater Skirt,White\n ................................\n ............................\n ........\n ...\n

"""

# Define a function to manage navigation and display appropriate pages
def navigate_to(page_name):
    """Set the page to navigate to."""
    st.session_state.current_page = page_name
    time.sleep(0.2)
    st.rerun()

# Define the main structure of the app with enhanced UI elements
def main():
    # Setting page config to make it more official
    st.set_page_config(page_title="Mocksi alpha", layout="wide")
    markdown_text = ""

    if st.session_state.current_page == "markdown_capture":
        st.title("🐦 Mocksi alpha")
        st.markdown("### Welcome to Mocksi alpha! Let's get started by generating some mock data.")

        st.markdown("#### Please paste your markdown data below:")
        markdown_text = st.text_area("Paste markdown data here", height=300, key="markdown_text", value=markdown_sample)

        if st.button("Continue"):
            navigate_to("email_input")
    # Introduction or email input page
    elif st.session_state.current_page == "email_input":
        st.title("🐦 Mocksi alpha")
        email = st.text_input("Enter your email to receive a magic login link:", key="email")

        if st.button("Send Magic Link"):
            if "@" in email and "." in email:  # Basic email validation
                st.success("✅ Magic login link sent. Please proceed.")
                navigate_to("recording_controls")
            else:
                st.error("❌ Invalid email. Please try again.")

    # Recording controls page
    elif st.session_state.current_page == "recording_controls":
         with st.container():
            prompt = st.chat_input("Describe what your demo should look like")
            if prompt:
                navigate_to("execute_content")

    # Execution confirmation page
    elif st.session_state.current_page == "execute_content":
        with st.chat_message("system"):
            for _, row in enumerate(markdown_text.split("\n")):
                st.markdown(row)
                time.sleep(0.2)

        st.chat_input("Any additional instructions?")

        if st.button("Continue"):
            navigate_to("confirmation_screen")

    # Final confirmation screen
    elif st.session_state.current_page == "confirmation_screen":
        with st.spinner(text="Generating mock data..."):
            time.sleep(2)
            st.success("Mock data ready! 🎉")

        with st.spinner(text="Deploying mock..."):
            time.sleep(3)
            st.success("Done")

        st.title("✅ Mock Ready!")
        st.success("The mock has been successfully deployed.")
        if st.button("Start Over"):
            navigate_to("markdown_capture")

# Initialize session state for navigation
if "current_page" not in st.session_state:
    st.session_state.current_page = "markdown_capture"

main()
