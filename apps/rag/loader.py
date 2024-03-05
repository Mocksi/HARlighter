import argparse
from pinecone import Pinecone
from dotenv import load_dotenv
import os
from llama_index.vector_stores.pinecone import PineconeVectorStore
from llama_index.core import VectorStoreIndex, StorageContext, ServiceContext
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.readers.database import DatabaseReader
from sqlalchemy import create_engine

load_dotenv()


def store_in_pinecone(vector_store, docs):
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    embed_model = OpenAIEmbedding(model="text-embedding-ada-002", embed_batch_size=200)
    service_context = ServiceContext.from_defaults(embed_model=embed_model)
    return VectorStoreIndex.from_documents(
        docs,
        storage_context=storage_context,
        service_context=service_context,
        show_progress=True,
        use_async=True,
    )


def build_vector_store(index_name):
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    pinecone_index = pc.Index(index_name)
    return PineconeVectorStore(pinecone_index=pinecone_index)


def get_docs_from_db(db_path):
    database_path = f"sqlite:///{db_path}"  # Note: Three slashes for relative path, four slashes for absolute
    engine = create_engine(database_path)

    db = DatabaseReader(engine=engine)
    query = """
    SELECT
        *
    FROM
        "events"
    WHERE
        -- Exclude rows with unknown base64 encoded data
        -- Exclude JPEG images
        "data" NOT LIKE '%AAABA%'
        -- Exclude SVG images
        AND "data" NOT LIKE '%PHN2Z%'
        -- Exclude Ogg Vorbis audio
        AND "data" NOT LIKE '%T2dnU%'
        -- Exclude WebP images
        AND "data" NOT LIKE '%d09GM%'
        -- Exclude PNG images
        AND "data" NOT LIKE '%iVBOR%';
    """
    return db.load_data(query=query)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Load data from a SQLite database, generate embeddings, and store them in Pinecone."
    )
    parser.add_argument(
        "--db_path", type=str, required=True, help="Path to the SQLite database file"
    )
    parser.add_argument(
        "--index_name",
        type=str,
        required=False,
        help="Name of the Pinecone index",
        default="web-capture2",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    db_path = args.db_path
    index_name = args.index_name

    docs = get_docs_from_db(db_path)
    vector_store = build_vector_store(index_name)
    store_in_pinecone(vector_store, docs)
