import streamlit as st
from pinecone import Pinecone
import argparse
from pinecone import Pinecone
from dotenv import load_dotenv
import os
from llama_index.vector_stores.pinecone import PineconeVectorStore
from llama_index.core import VectorStoreIndex
from openai import OpenAI

load_dotenv()


def main():
    st.title("RAG playground")
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    pinecone_index = pc.Index("web-capture")
    vector_store = PineconeVectorStore(pinecone_index=pinecone_index)

    index = VectorStoreIndex.from_vector_store(vector_store=vector_store)
    query_engine = index.as_query_engine()


    responses = query_engine.query("find as many calls to pastebin.com as you can.")
    
    context = f"You have been tasked to demo pastebin to a potential customer. You need to create a demo that shows what this website can do. Create a series of CURL cals to build this demo. See these examples: {responses}"


    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    completion = client.chat.completions.create(
        model='gpt-4-0125-preview',
        messages=[
        {"role": "system", "content": "Role: you are sales engineer, an expert at building demos for websites.\n\n"},
        {"role": "user", "content": context}
        ]
    )
    st.markdown(completion.choices[0].message.content)


if __name__ == "__main__":
    main()
