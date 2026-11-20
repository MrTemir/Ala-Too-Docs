import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session
from app.models import User, UserRole
from app.schemas import LoginRequest, LoginResponse, RegisterRequest
from app.security import create_access_token, hash_password, verify_password

UNIVERSITY_EMAIL_DOMAIN = "alatoo.edu.kg"
EMAIL_PATTERN = re.compile(
    rf"^[A-Za-z0-9._%+\-]+@{re.escape(UNIVERSITY_EMAIL_DOMAIN)}\Z",
    re.IGNORECASE,
)
STUDENT_ID_PATTERN = re.compile(r"^[A-Za-z0-9]{3,32}\Z")
PERSON_NAME_PATTERN = re.compile(
    r"[^\W\d_]+(?:[ '\u2019-][^\W\d_]+)*",
    re.UNICODE,
)


router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_db_session),
) -> LoginResponse:
    result = await session.execute(
        select(User).where(
            User.university_id == canonicalize_identifier(payload.university_id)
        )
    )
    user = result.scalar_one_or_none()

    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid university ID or password",
        )

    return LoginResponse(
        access_token=create_access_token(str(user.id)),
        user=user,
    )


@router.post(
    "/register",
    response_model=LoginResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    payload: RegisterRequest,
    session: AsyncSession = Depends(get_db_session),
) -> LoginResponse:
    identifier = normalize_identifier(payload.university_id)
    first_name = normalize_person_name(payload.first_name)
    last_name = normalize_person_name(payload.last_name)
    validate_password(payload.password, payload.password_confirm)

    existing = await session.execute(
        select(User.id).where(User.university_id == identifier)
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="identifier_taken",
        )

    user = User(
        university_id=identifier,
        full_name=f"{first_name} {last_name}",
        role=UserRole.student,
        password_hash=hash_password(payload.password),
    )
    session.add(user)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="identifier_taken",
        ) from None

    return LoginResponse(
        access_token=create_access_token(str(user.id)),
        user=user,
    )


def canonicalize_identifier(value: str) -> str:
    identifier = value.strip()
    if "@" in identifier:
        return identifier.lower()
    return identifier


def normalize_identifier(value: str) -> str:
    identifier = canonicalize_identifier(value)
    if "@" in identifier:
        if EMAIL_PATTERN.fullmatch(identifier) is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="invalid_identifier",
            )
        return identifier

    if STUDENT_ID_PATTERN.fullmatch(identifier) is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="invalid_identifier",
        )
    return identifier


def normalize_person_name(value: str) -> str:
    name = " ".join(value.strip().split())
    if PERSON_NAME_PATTERN.fullmatch(name) is None or len(name) > 80:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="invalid_name",
        )
    return name


def validate_password(password: str, password_confirm: str) -> None:
    if password != password_confirm:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="password_mismatch",
        )
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="password_too_short",
        )
    if len(password) > 128:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="password_too_long",
        )
