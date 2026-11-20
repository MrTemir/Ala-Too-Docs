"""Служебные команды AlaToo-Doc.

Создать пользователя (пароль спросит интерактивно, в историю shell не попадёт):
    docker compose exec backend python -m app.cli create-user \
        --university-id 123 --full-name "Иванов Иван" --role admin

Создать таблицы (выполняется автоматически при старте контейнера):
    python -m app.cli init-db

Сменить пароль существующему:
    docker compose exec backend python -m app.cli set-password --university-id 123
"""

import argparse
import asyncio
import getpass
import sys

from sqlalchemy import select

from app.database import AsyncSessionLocal, Base, close_db_connection, engine
from app.models import User, UserRole
from app.security import hash_password


def _read_password() -> str:
    password = getpass.getpass("Пароль: ")
    if len(password) < 8:
        sys.exit("Пароль должен быть не короче 8 символов")
    if password != getpass.getpass("Повторите пароль: "):
        sys.exit("Пароли не совпадают")
    return password


async def init_db(_: argparse.Namespace | None = None) -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)


async def create_user(args: argparse.Namespace) -> None:
    await init_db()

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.university_id == args.university_id)
        )
        if result.scalar_one_or_none() is not None:
            sys.exit(f"Пользователь с university_id={args.university_id} уже существует")

        user = User(
            university_id=args.university_id,
            full_name=args.full_name,
            role=UserRole(args.role),
            faculty=args.faculty,
            group_name=args.group,
            password_hash=hash_password(_read_password()),
        )
        session.add(user)
        await session.commit()
        print(f"Создан пользователь {user.full_name} ({user.role.value}), id={user.id}")


async def set_password(args: argparse.Namespace) -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.university_id == args.university_id)
        )
        user = result.scalar_one_or_none()
        if user is None:
            sys.exit(f"Пользователь с university_id={args.university_id} не найден")

        user.password_hash = hash_password(_read_password())
        await session.commit()
        print(f"Пароль обновлён для {user.full_name}")


def main() -> None:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    commands = parser.add_subparsers(dest="command", required=True)

    init = commands.add_parser("init-db", help="создать таблицы, если их ещё нет")
    init.set_defaults(handler=init_db)

    create = commands.add_parser("create-user", help="создать пользователя")
    create.add_argument("--university-id", required=True)
    create.add_argument("--full-name", required=True)
    create.add_argument("--role", required=True, choices=[role.value for role in UserRole])
    create.add_argument("--faculty")
    create.add_argument("--group")
    create.set_defaults(handler=create_user)

    password = commands.add_parser("set-password", help="сменить пароль пользователю")
    password.add_argument("--university-id", required=True)
    password.set_defaults(handler=set_password)

    args = parser.parse_args()

    async def run() -> None:
        try:
            await args.handler(args)
        finally:
            await close_db_connection()

    asyncio.run(run())


if __name__ == "__main__":
    main()
