from app.db.bootstrap import bootstrap_database


if __name__ == "__main__":
    result = bootstrap_database()
    print(f"DB connection successful: {result['connected']}")
    print(f"Created tables: {result['tables']}")
    print("Sample inserted data:")
    for item in result['seeded_products'][:5]:
        print(item)
