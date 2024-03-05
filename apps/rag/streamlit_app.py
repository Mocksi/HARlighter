import streamlit as st
from pinecone import Pinecone
import argparse
from pinecone import Pinecone
from dotenv import load_dotenv
import os
from llama_index.vector_stores.pinecone import PineconeVectorStore
from llama_index.core import VectorStoreIndex
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.core import Settings
from llama_index.llms.openai import OpenAI

Settings.llm = OpenAI(temperature=0.2, model="gpt-4-0125-preview")

load_dotenv()


def main():
    st.title("RAG playground")
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    pinecone_index = pc.Index("web-capture2")
    vector_store = PineconeVectorStore(pinecone_index=pinecone_index)

    vector_index = VectorStoreIndex.from_vector_store(vector_store=vector_store)
    retriever = VectorIndexRetriever(index=vector_index, similarity_top_k=10)
    query_engine = RetrieverQueryEngine(retriever=retriever)

    prompt = """
    You have been tasked with demonstrating a product located at http://localhost:3000 to a potential customer. Your goal is to create a demo that showcases what this product can do. The task involves creating a Python script that automates the creation of a new user and posts a "hi" message, using only built-in Python libraries and the requests library. This demo should be executable on any machine with Python installed.

    For the purposes of the demo, avoid asking for the user's name; instead, generate a name, with a creative twist such as using bird names (e.g., 'EagleDemoUser'). Similarly, do not request an email address; use a placeholder email like 'eagledemouser@example.com'. All demo users should share the same password, 'newpassword'.

    The user must be confirmed before they can post a message, typically done through a confirmation email. For the demo, simulate this by retrieving the confirmation email from a mock mail server accessible via http://localhost:3000/letter_opener. Use a regular expression pattern r'letter_opener/([^/]+)/rich' to find the email, and extract the confirmation link that starts with http://localhost:3000/auth/confirmation?confirmation_token= from the email body. Then, programmatically confirm the user by navigating to the confirmation link.

    Your script should handle the following tasks:

    Sign up a new user with a creative username and a predefined email and password.
    Retrieve the confirmation token by parsing the mock mail server's content.
    Confirm the user by "clicking" on the confirmation link found in the email.
    Post a "hi" message using the newly confirmed user's credentials.
    Repeat the process for a second user, but this time, use a different creative username and email address.
    Then make the first user reply to the second user with a joke about birds.


    Be as detailed as possible, and write code that can be run immediately. You can use the requests library to interact with the server. You can assume that the server is running and that the mock mail server is accessible. You can also assume that the server is in a clean state, with no users or messages. You can use the requests library to interact with the server. You can assume that the server is running and that the mock mail server is accessible. You can also assume that the server is in a clean state, with no users or messages.
    """

    llm_query = query_engine.query(prompt)
    st.markdown(llm_query.response)


if __name__ == "__main__":
    main()
