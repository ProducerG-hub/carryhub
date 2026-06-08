INSERT INTO categories (name, description)
VALUES
('Men Bags', 'Bags designed for men including office and laptop bags'),

('Women Bags', 'Fashionable handbags and shoulder bags for women'),

('Travel Bags', 'Durable bags suitable for travel and luggage'),

('School Bags', 'Backpacks and school bags for students'),

('Sports Bags', 'Sports and gym bags');

INSERT INTO products
(
    category_id,
    name,
    description,
    price,
    stock_quantity,
    image_url
)
VALUES

(
    1,
    'Classic Laptop Bag',
    'Professional laptop bag for office use',
    75000.00,
    25,
    '/images/products/laptop-bag.jpg'
),

(
    1,
    'Executive Office Bag',
    'Premium office bag for professionals',
    95000.00,
    15,
    '/images/products/office-bag.jpg'
);

INSERT INTO products
(
    category_id,
    name,
    description,
    price,
    stock_quantity,
    image_url
)
VALUES

(
    2,
    'Elegant Handbag',
    'Stylish handbag for daily use',
    65000.00,
    30,
    '/images/products/handbag.jpg'
),

(
    2,
    'Luxury Shoulder Bag',
    'Modern shoulder bag for fashion lovers',
    85000.00,
    20,
    '/images/products/shoulder-bag.jpg'
);

INSERT INTO products
(
    category_id,
    name,
    description,
    price,
    stock_quantity,
    image_url
)
VALUES

(
    3,
    'Durable Travel Bag',
    'Spacious travel bag for long trips',
    120000.00,
    10,
    '/images/products/travel-bag.jpg'
),

(
    3,
    'Lightweight Luggage',
    'Easy-to-carry luggage for travelers',
    150000.00,
    5,
    '/images/products/luggage.jpg'
);

INSERT INTO products
(
    category_id,
    name,
    description,
    price,
    stock_quantity,
    image_url
)
VALUES

(
    4,
    'Student Backpack',
    'Comfortable backpack for students',
    50000.00,
    40,
    '/images/products/backpack.jpg'
),

(
    4,
    'School Bag with Laptop Compartment',
    'School bag with a special compartment for laptops',
    70000.00,
    20,
    '/images/products/school-bag.jpg'
);

INSERT INTO products
(
    category_id,
    name,
    description,
    price,
    stock_quantity,
    image_url
)
VALUES

(
    5,
    'Sports Duffel Bag',
    'Durable bag for sports equipment',
    60000.00,
    25,
    '/images/products/duffel-bag.jpg'
),

(
    5,
    'Gym Water Bottle',
    'Reusable water bottle for workouts',
    2000.00,
    100,
    '/images/products/water-bottle.jpg'
);