-- =====================================
-- CarryHub E-Commerce Database Schema
-- PostgreSQL
-- =====================================

-- Users Table
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,

    full_name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    role VARCHAR(20) NOT NULL DEFAULT 'customer'
        CHECK (role IN ('admin', 'customer')),

    phone VARCHAR(20),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE categories (
    category_id BIGSERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,

    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE products (
    product_id BIGSERIAL PRIMARY KEY,

    category_id BIGINT NOT NULL,

    name VARCHAR(255) NOT NULL,

    description TEXT,

    price DECIMAL(10,2) NOT NULL
        CHECK (price >= 0),

    stock_quantity INTEGER NOT NULL DEFAULT 0
        CHECK (stock_quantity >= 0),

    image_url TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id)
        REFERENCES categories(category_id)
        ON DELETE RESTRICT
);

--Cart Table
CREATE TABLE cart (
    cart_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL UNIQUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cart_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

--Cart Items Table
CREATE TABLE cart_items (
    cart_item_id BIGSERIAL PRIMARY KEY,

    cart_id BIGINT NOT NULL,

    product_id BIGINT NOT NULL,

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    CONSTRAINT fk_cart_items_cart
        FOREIGN KEY (cart_id)
        REFERENCES cart(cart_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cart_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_cart_product
        UNIQUE (cart_id, product_id)
);

-- Orders Table
CREATE TABLE orders (
    order_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    total_amount DECIMAL(10,2) NOT NULL
        CHECK (total_amount >= 0),

    shipping_address TEXT NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (
            status IN (
                'PENDING',
                'PAID',
                'SHIPPED',
                'DELIVERED',
                'CANCELLED'
            )
        ),

    order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
);

-- Order Items Table
CREATE TABLE order_items (
    order_item_id BIGSERIAL PRIMARY KEY,

    order_id BIGINT NOT NULL,

    product_id BIGINT NOT NULL,

    quantity INTEGER NOT NULL
        CHECK (quantity > 0),

    unit_price DECIMAL(10,2) NOT NULL
        CHECK (unit_price >= 0),

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON DELETE RESTRICT,

    CONSTRAINT uq_order_product
        UNIQUE (order_id, product_id)
);

--payment Table
CREATE TABLE payments (
    payment_id BIGSERIAL PRIMARY KEY,

    order_id BIGINT NOT NULL UNIQUE,

    paypal_transaction_id VARCHAR(255),

    amount DECIMAL(10,2) NOT NULL
        CHECK (amount >= 0),

    payment_method VARCHAR(50) NOT NULL DEFAULT 'PAYPAL',

    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (
            payment_status IN (
                'PENDING',
                'COMPLETED',
                'FAILED',
                'REFUNDED'
            )
        ),

    payment_date TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
        ON DELETE CASCADE
);

-- Indexes for performance optimization
CREATE INDEX idx_products_category
ON products(category_id);

CREATE INDEX idx_orders_user
ON orders(user_id);

CREATE INDEX idx_order_items_order
ON order_items(order_id);

CREATE INDEX idx_cart_items_cart
ON cart_items(cart_id);

CREATE INDEX idx_payments_order
ON payments(order_id);