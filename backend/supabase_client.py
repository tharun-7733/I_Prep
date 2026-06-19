import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

def get_supabase_client() -> Client:
    """
    Initialize and return the Supabase client.
    Ensure that SUPABASE_URL and SUPABASE_KEY are set in your environment or .env file.
    """
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Supabase credentials not found. Please set SUPABASE_URL and SUPABASE_KEY.")
    
    return create_client(SUPABASE_URL, SUPABASE_KEY)