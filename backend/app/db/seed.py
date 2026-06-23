from app.models import Product


SEED_PRODUCTS = [
    {
        "id": 1,
        "name": "Classic Leather Diary",
        "category": "Notebooks",
        "description": "Premium leather-bound diary with bookmark ribbon",
        "price": 450,
        "offer_price": 400,
        "image_url": "/images/diary_leather_1.jpg",
        "is_active": True,
    },
    {
        "id": 2,
        "name": "Luxury Gel Pen",
        "category": "Pens",
        "description": "Smooth writing premium gel pen with metal clip",
        "price": 180,
        "offer_price": 160,
        "image_url": "/New_release/luxury_gel_pen.jpg",
        "is_active": True,
    },
    {
        "id": 3,
        "name": "Pastel Spiral Notebook",
        "category": "Notebooks",
        "description": "Trendy pastel spiral notebook for daily notes",
        "price": 170,
        "offer_price": 150,
        "image_url": "/New_release/pastel_spiral_notebook.jpg",
        "is_active": True,
    },
    {
        "id": 4,
        "name": "Watercolor Brush Pen Set",
        "category": "Art",
        "description": "Set of 12 brush pens ideal for watercolor effects",
        "price": 550,
        "offer_price": 499,
        "image_url": "/New_release/watercolor_brush_pens.jpg",
        "is_active": True,
    },
    {
        "id": 5,
        "name": "Sticky Notes Neon Pack",
        "category": "Sticky-Notes",
        "description": "Pack of neon sticky notes in assorted shapes",
        "price": 90,
        "offer_price": 75,
        "image_url": "/New_release/neon_stickynotes.jpg",
        "is_active": True,
    },
    {
        "id": 6,
        "name": "Craft Glue & Glitter Pack",
        "category": "Craft-Supply",
        "description": "Craft glue, glitter tubes, and accessories kit",
        "price": 200,
        "offer_price": 180,
        "image_url": "/New_release/glue_glitter_kit.jpg",
        "is_active": True,
    },
    {
        "id": 7,
        "name": "Adventures of Timmy",
        "category": "Storybooks",
        "description": "Illustrated storybook for kids with fun adventures",
        "price": 250,
        "offer_price": 230,
        "image_url": "/New_release/timmy_adventures.jpg",
        "is_active": True,
    },
    {
        "id": 8,
        "name": "Magnetic Closure Diary",
        "category": "Diary",
        "description": "Elegant diary with magnetic lock and ribbon bookmark",
        "price": 500,
        "offer_price": 460,
        "image_url": "/New_release/magnetic_diary.jpg",
        "is_active": True,
    },
    {
        "id": 13,
        "name": "Alcohol Marker Set",
        "category": "Markers",
        "description": "Set of 12 alcohol-based marker pens for artists",
        "price": 650,
        "offer_price": 599,
        "image_url": "/images/marker_pens.jpg",
        "is_active": True,
    },
    {
        "id": 14,
        "name": "Weekly Planner Notebook",
        "category": "Planners",
        "description": "Weekly planner with removable stickers and pockets",
        "price": 320,
        "offer_price": 289,
        "image_url": "/images/planner_stickers.jpg",
        "is_active": True,
    },
]


def seed_products(session):
    inserted = []
    for product_data in SEED_PRODUCTS:
        existing = session.get(Product, product_data["id"])
        if existing:
            inserted.append(existing)
            continue

        product = Product(**product_data)
        session.add(product)
        inserted.append(product)

    session.commit()

    return [
        {
            "id": product.id,
            "name": product.name,
            "category": product.category,
            "price": float(product.price),
            "offer_price": float(product.offer_price),
            "image_url": product.image_url,
        }
        for product in inserted
    ]
