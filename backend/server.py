import os
import time
import logging
import jwt
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import structlog
from slowapi.errors import RateLimitExceeded

# Import config, auth, and database to trigger startup validation and connect client
from backend import config
from backend.auth import fetch_clerk_keys
from backend.database import db

# Import routers
from backend.routers.auth import router as auth_router
from backend.routers.projects import router as projects_router
from backend.routers.tasks import router as tasks_router
from backend.routers.memory import router as memory_router
from backend.routers.ai import router as ai_router
from backend.routers.stats import router as stats_router
from backend.routers.ai import limiter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.PrintLoggerFactory(),
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    cache_logger_on_first_use=True,
)
struct_logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await fetch_clerk_keys()
    logger.info("GhostBoard AI backend started")
    yield

# Initialize FastAPI
app = FastAPI(title="GhostBoard AI API", docs_url="/api/docs", lifespan=lifespan)

# Register rate limiter with state
app.state.limiter = limiter

# ========== CORS CONFIGURATION ==========
ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")
if ENVIRONMENT == "production":
    allow_origins = ["https://ghostboard.ai"]
else:
    allow_origins = [
        "https://ghostboard.ai",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========== STRUCTURED LOGGING MIDDLEWARE ==========
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    start_time = time.time()
    
    user_id = None
    auth_header = request.headers.get("Authorization", "")
    token = auth_header[7:] if auth_header.startswith("Bearer ") else None
    if token:
        try:
            if token == "mock_test_token":
                user_id = "test_clerk_user_123"
            else:
                unverified = jwt.decode(token, options={"verify_signature": False})
                user_id = unverified.get("sub")
        except Exception:
            pass

    response = await call_next(request)
    duration = time.time() - start_time
    
    struct_logger.info(
        "request_processed",
        path=request.url.path,
        method=request.method,
        user_id=user_id,
        status_code=response.status_code,
        duration_sec=f"{duration:.4f}"
    )
    return response

# ========== CENTRALIZED EXCEPTION HANDLERS ==========
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "HTTPException", "message": exc.detail}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    msg = "; ".join([f"{'.'.join(str(l) for l in err['loc'])}: {err['msg']}" for err in errors])
    return JSONResponse(
        status_code=422,
        content={"error": "ValidationError", "message": msg}
    )

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"error": "RateLimitExceeded", "message": "Rate limit exceeded. Please try again later."}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled server exception")
    return JSONResponse(
        status_code=500,
        content={"error": "InternalServerError", "message": str(exc)}
    )

# ========== HEALTH CHECK ==========
@app.get("/healthz", tags=["Health"])
async def healthz():
    return {"status": "OK"}

# ========== INCLUDE ROUTERS ==========
app.include_router(auth_router, prefix="/api")
app.include_router(projects_router, prefix="/api")
app.include_router(tasks_router, prefix="/api")
app.include_router(memory_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(stats_router, prefix="/api")

# ========== LIFECYCLE EVENT HANDLERS ==========
# Handled via lifespan asynccontextmanager

# ========== SERVE REACT FRONTEND ==========
# Mount the static files (JS, CSS, images) from React build
REPO_ROOT = Path(__file__).resolve().parent.parent
build_static_dir = REPO_ROOT / "frontend" / "build" / "static"
if build_static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(build_static_dir)), name="static")

@app.get("/{catchall:path}", response_class=HTMLResponse)
async def serve_react_app(request: Request, catchall: str):
    # If the request starts with api, docs, or openapi.json, let FastAPI handle it or return 404
    if catchall.startswith("api") or catchall.startswith("docs") or catchall.startswith("openapi.json"):
        raise StarletteHTTPException(status_code=404, detail="Not Found")
    
    build_dir = REPO_ROOT / "frontend" / "build"
    file_path = build_dir / catchall
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
        
    index_path = build_dir / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
        
    return HTMLResponse("React build not found. Please run npm run build in frontend.")

if __name__ == "__main__":
    import uvicorn
    # Start the server on port 8000 with auto-reload enabled
    uvicorn.run("backend.server:app", host="127.0.0.1", port=8000, reload=True)
