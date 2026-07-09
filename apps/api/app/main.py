from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import structlog
import sentry_sdk

from app.routers import predict, health, knowledge, scans, gradcam
from app.config import settings

if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        traces_sample_rate=0.1 if settings.ENVIRONMENT == "production" else 0.0,
        profiles_sample_rate=0.1 if settings.ENVIRONMENT == "production" else 0.0,
    )

logger = structlog.get_logger()
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for CropAI v2",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB

@app.middleware("http")
async def limit_upload_size(request: Request, call_next):
    if request.method == "POST":
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_UPLOAD_SIZE:
            return JSONResponse(
                status_code=413,
                content={"detail": "Payload Too Large. Maximum upload size is 10MB."}
            )
    return await call_next(request)

@app.middleware("http")
async def structlog_middleware(request: Request, call_next):
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        method=request.method,
        path=request.url.path,
        client_ip=request.client.host if request.client else None
    )
    return await call_next(request)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix=settings.API_V1_STR, tags=["Health"])
app.include_router(predict.router, prefix=settings.API_V1_STR, tags=["Predict"])
app.include_router(gradcam.router, prefix=settings.API_V1_STR, tags=["GradCAM"])
app.include_router(knowledge.router, prefix=settings.API_V1_STR, tags=["Knowledge"])
app.include_router(scans.router, prefix=f"{settings.API_V1_STR}/scans", tags=["Scans"])

@app.get("/")
def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API. Visit /docs for documentation."}

