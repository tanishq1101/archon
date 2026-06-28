import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Validate required variables
REQUIRED_VARS = {
    "SUPABASE_URL": os.environ.get("SUPABASE_URL"),
    "SUPABASE_SERVICE_ROLE_KEY": os.environ.get("SUPABASE_SERVICE_ROLE_KEY"),
    "CLERK_JWKS_URL": os.environ.get("CLERK_JWKS_URL"),
}

missing_vars = [var for var, val in REQUIRED_VARS.items() if not val]

if missing_vars:
    logger.critical(f"Missing required environment variables: {', '.join(missing_vars)}")
    logger.critical("Please set them in your backend/.env file.")
    sys.exit(1)

# Variables with fallbacks / optional variables
SUPABASE_URL = REQUIRED_VARS["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = REQUIRED_VARS["SUPABASE_SERVICE_ROLE_KEY"]
CLERK_JWKS_URL = REQUIRED_VARS["CLERK_JWKS_URL"]

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
if not OPENROUTER_API_KEY:
    logger.warning("OPENROUTER_API_KEY is not set. AI functionalities will fail.")

DEFAULT_MODEL = os.environ.get("AI_MODEL", "google/gemini-2.5-flash:free")
