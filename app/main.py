from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app import models
from app.database import AsyncSessionLocal, Base, close_db_connection, engine
from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.documents import generate_router
from app.routers.documents import router as documents_router
from app.routers.users import router as users_router


STATIC_DIR = Path("static")
PDF_STORAGE_DIR = STATIC_DIR / "pdfs"
GENERATED_PDF_STORAGE_DIR = STATIC_DIR / "generated_pdfs"


async def ensure_local_schema() -> None:
    if not str(engine.url).startswith("sqlite"):
        return

    async with engine.begin() as connection:
        result = await connection.execute(text("PRAGMA table_info(users)"))
        columns = {row[1] for row in result.fetchall()}

        if "faculty" not in columns:
            await connection.execute(text("ALTER TABLE users ADD COLUMN faculty VARCHAR(255)"))

        if "group_name" not in columns:
            await connection.execute(text("ALTER TABLE users ADD COLUMN group_name VARCHAR(64)"))

        result = await connection.execute(text("PRAGMA table_info(documents)"))
        document_columns = {row[1] for row in result.fetchall()}

        if "doc_type" not in document_columns:
            await connection.execute(text("ALTER TABLE documents ADD COLUMN doc_type VARCHAR(64)"))

        if "language" not in document_columns:
            await connection.execute(text("ALTER TABLE documents ADD COLUMN language VARCHAR(16)"))

        if "created_at" not in document_columns:
            await connection.execute(
                text("ALTER TABLE documents ADD COLUMN created_at DATETIME")
            )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    await ensure_local_schema()

    yield

    await close_db_connection()


app = FastAPI(
    title="alatoo-doc",
    version="0.1.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.56.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(generate_router)
app.include_router(users_router)
app.include_router(admin_router)
PDF_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
GENERATED_PDF_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", tags=["root"])
async def root() -> dict[str, str]:
    return {"message": "Welcome to Alatoo-Doc API"}


@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
