// src/scheme.js
const schemaData = [
    // 1. CUSTOMERS TABLE
    `CREATE TABLE customers (
        customer_id INT PRIMARY KEY,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        email VARCHAR(100),
        phone VARCHAR(20),
        city VARCHAR(50),
        state VARCHAR(50),
        zip_code VARCHAR(10),
        registration_date DATE,
        loyalty_tier VARCHAR(20) CHECK (loyalty_tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
        total_spent DECIMAL(12,2) DEFAULT 0
    )`,

    // 2. PRODUCTS TABLE
    `CREATE TABLE products (
        product_id INT PRIMARY KEY,
        product_name VARCHAR(100),
        category VARCHAR(50),
        subcategory VARCHAR(50),
        supplier_id INT,
        unit_price DECIMAL(10,2),
        cost DECIMAL(10,2),
        stock_quantity INT,
        reorder_level INT,
        discontinued BOOLEAN DEFAULT FALSE
    )`,

    // 3. EMPLOYEES TABLE
    `CREATE TABLE employees (
        employee_id INT PRIMARY KEY,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        title VARCHAR(100),
        department VARCHAR(50),
        manager_id INT,
        hire_date DATE,
        salary DECIMAL(12,2),
        commission_rate DECIMAL(5,2),
        birth_date DATE,
        FOREIGN KEY (manager_id) REFERENCES employees(employee_id)
    )`,

    // 4. ORDERS TABLE
    `CREATE TABLE orders (
        order_id INT PRIMARY KEY,
        customer_id INT,
        employee_id INT,
        order_date DATE,
        required_date DATE,
        shipped_date DATE,
        ship_via VARCHAR(50),
        freight DECIMAL(10,2),
        ship_address VARCHAR(200),
        ship_city VARCHAR(50),
        ship_state VARCHAR(50),
        status VARCHAR(20),
        FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
    )`,

    // 5. ORDER_DETAILS TABLE
    `CREATE TABLE order_details (
        order_detail_id INT PRIMARY KEY,
        order_id INT,
        product_id INT,
        unit_price DECIMAL(10,2),
        quantity INT,
        discount DECIMAL(4,2) DEFAULT 0,
        FOREIGN KEY (order_id) REFERENCES orders(order_id),
        FOREIGN KEY (product_id) REFERENCES products(product_id)
    )`,

    // 6. SUPPLIERS TABLE
    `CREATE TABLE suppliers (
        supplier_id INT PRIMARY KEY,
        company_name VARCHAR(100),
        contact_name VARCHAR(50),
        contact_title VARCHAR(50),
        city VARCHAR(50),
        country VARCHAR(50),
        phone VARCHAR(20),
        rating DECIMAL(3,2)
    )`,

    // 7. PAYMENTS TABLE
    `CREATE TABLE payments (
        payment_id INT PRIMARY KEY,
        order_id INT,
        payment_date DATE,
        amount DECIMAL(12,2),
        payment_method VARCHAR(30),
        transaction_id VARCHAR(100),
        status VARCHAR(20),
        FOREIGN KEY (order_id) REFERENCES orders(order_id)
    )`,

    // 8. INVENTORY_LOG TABLE
    `CREATE TABLE inventory_log (
        log_id INT PRIMARY KEY,
        product_id INT,
        change_date DATE,
        quantity_change INT,
        change_type VARCHAR(20),
        reference_id INT,
        FOREIGN KEY (product_id) REFERENCES products(product_id)
    )`
];

export default schemaData;