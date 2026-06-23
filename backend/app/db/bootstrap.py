from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.core.security import hash_password
from app.core.config import settings
from app.models import Base, Product
from app.models import User
from app.db.seed import seed_products


def build_database_url() -> str:
   return settings.DATABASE_URL

engine = create_engine(build_database_url(), pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def verify_connection() -> bool:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return True


def create_tables() -> list[str]:
    Base.metadata.create_all(bind=engine)
    
    # Add status column to contact_messages if it doesn't exist
    with engine.connect() as connection:
        try:
            if engine.dialect.name == "sqlite":
                # SQLite: Check if column exists
                cursor = connection.execute(text("PRAGMA table_info(contact_messages)"))
                columns = [row[1] for row in cursor.fetchall()]
                if "status" not in columns:
                    connection.execute(text("ALTER TABLE contact_messages ADD COLUMN status VARCHAR(50) DEFAULT 'under_review'"))
                    connection.commit()
            elif engine.dialect.name == "postgresql":
                # PostgreSQL: Check if column exists
                cursor = connection.execute(text(
                    "SELECT column_name FROM information_schema.columns "
                    "WHERE table_name='contact_messages' AND column_name='status'"
                ))
                if not cursor.fetchone():
                    connection.execute(text("ALTER TABLE contact_messages ADD COLUMN status VARCHAR(50) DEFAULT 'under_review'"))
                    connection.commit()
            elif engine.dialect.name == "mysql":
                # MySQL: Check if column exists
                cursor = connection.execute(text(
                    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS "
                    "WHERE TABLE_NAME='contact_messages' AND COLUMN_NAME='status'"
                ))
                if not cursor.fetchone():
                    connection.execute(text("ALTER TABLE contact_messages ADD COLUMN status VARCHAR(50) DEFAULT 'under_review'"))
                    connection.commit()
        except Exception:
            # If any error occurs during migration, continue (column might already exist)
            pass
    
    return sorted(Base.metadata.tables.keys())


def seed_database() -> list[dict]:
    session = SessionLocal()
    try:
        seeded_products = seed_products(session)

        if engine.dialect.name == "postgresql":
            session.execute(
                text(
                    "SELECT setval("
                    "pg_get_serial_sequence('products', 'id'), "
                    "COALESCE((SELECT MAX(id) FROM products), 1), true"
                    ")"
                )
            )
            session.commit()

        return seeded_products
    finally:
        session.close()


def seed_owner_account() -> dict:
    session = SessionLocal()
    try:
        owner_email = settings.shop_owner_email.strip().lower()
        owner_name = settings.shop_owner_name.strip()
        owner_password_hash = hash_password(settings.shop_owner_password)
        owner = session.query(User).filter(User.email == owner_email).first()
        if not owner:
            owner = User(
                name=owner_name,
                email=owner_email,
                password_hash=owner_password_hash,
            )
            session.add(owner)
        else:
            owner.name = owner_name
            owner.password_hash = owner_password_hash

        session.commit()
        session.refresh(owner)

        return {"id": owner.id, "email": owner.email, "name": owner.name}
    finally:
        session.close()


def bootstrap_database() -> dict:
    connected = verify_connection()
    tables = create_tables()
    seeded_products = seed_database()
    owner_account = seed_owner_account()

    return {
        "connected": connected,
        "tables": tables,
        "seeded_products": seeded_products,
        "owner_account": owner_account,
    }
