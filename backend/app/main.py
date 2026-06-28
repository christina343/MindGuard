from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.routers import analyze, users

app = FastAPI()

# Standard CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(users.router, tags=["Users"])

@app.get("/")
async def root():
    return {"message": "MindGuard API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}