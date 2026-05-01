// questions.js
const questions = [
  {
    id: 1,
    title: "Find Gold and Platinum Customers",
    question: "Find all customers who have loyalty tier 'Gold' or 'Platinum' and have spent more than $10,000. Show their first name, last name, loyalty tier, and total spent.",
    difficulty: "Easy",
    minimalAnswer: "SELECT first_name, last_name, loyalty_tier as a, total_spent FROM customers WHERE loyalty_tier IN ('Gold', 'Platinum') AND total_spent > 10000;",
    maximalAnswer: "SELECT first_name, last_name, loyalty_tier as a, total_spent, customer_id, email, city, state FROM customers WHERE loyalty_tier IN ('Gold', 'Platinum') AND total_spent > 10000;",
    solved: 0
  },
  {
    id: 2,
    title: "Find Discontinued Products",
    question: "List all products that are discontinued. Show the product name and stock quantity.",
    difficulty: "Easy",
    minimalAnswer: "SELECT product_name, stock_quantity FROM products WHERE discontinued = TRUE;",
    maximalAnswer: "SELECT product_name, stock_quantity, product_id, category, unit_price FROM products WHERE discontinued = TRUE;",
    solved: 0
  },
  {
    id: 3,
    title: "Products Needing Reorder",
    question: "Find products where stock quantity is less than or equal to reorder level. Show product name, stock quantity, and reorder level.",
    difficulty: "Easy",
    minimalAnswer: "SELECT product_name, stock_quantity, reorder_level FROM products WHERE stock_quantity <= reorder_level AND discontinued = FALSE;",
    maximalAnswer: "SELECT product_name, stock_quantity, reorder_level, product_id, category FROM products WHERE stock_quantity <= reorder_level AND discontinued = FALSE ORDER BY stock_quantity ASC;",
    solved: 0
  },
  {
    id: 4,
    title: "Sales Employees with Commission",
    question: "Find all employees in the Sales department who earn commission. Show their first name, last name, and commission rate.",
    difficulty: "Easy",
    minimalAnswer: "SELECT first_name, last_name, commission_rate FROM employees WHERE department = 'Sales' AND commission_rate > 0;",
    maximalAnswer: "SELECT first_name, last_name, commission_rate, employee_id, title, salary FROM employees WHERE department = 'Sales' AND commission_rate > 0 ORDER BY commission_rate DESC;",
    solved: 0
  },
  {
    id: 5,
    title: "Completed Payments",
    question: "Find all completed payments. Show the payment method and amount.",
    difficulty: "Easy",
    minimalAnswer: "SELECT payment_method, amount FROM payments WHERE status = 'Completed';",
    maximalAnswer: "SELECT payment_method, amount, payment_id, order_id, payment_date FROM payments WHERE status = 'Completed';",
    solved: 0
  },
  {
    id: 6,
    title: "Products Never Ordered",
    question: "Find products that have never been ordered. Show the product name and category.",
    difficulty: "Medium",
    minimalAnswer: "SELECT p.product_name, p.category FROM products p LEFT JOIN order_details od ON p.product_id = od.product_id WHERE od.product_id IS NULL;",
    maximalAnswer: "SELECT p.product_name, p.category, p.product_id, p.unit_price, p.stock_quantity FROM products p LEFT JOIN order_details od ON p.product_id = od.product_id WHERE od.product_id IS NULL;",
    solved: 0
  },
  {
    id: 7,
    title: "Customer Order Count",
    question: "Find customers who have placed more than 2 orders. Show their first name, last name, and number of orders.",
    difficulty: "Medium",
    minimalAnswer: "SELECT c.first_name, c.last_name, COUNT(o.order_id) as order_count FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id HAVING COUNT(o.order_id) > 2;",
    maximalAnswer: "SELECT c.first_name, c.last_name, COUNT(o.order_id) as order_count, c.customer_id, c.loyalty_tier FROM customers c JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id HAVING COUNT(o.order_id) > 2;",
    solved: 0
  },
  {
    id: 8,
    title: "Employee Hierarchy",
    question: "Find employees and their managers. Show employee first name, employee last name, and manager first name.",
    difficulty: "Medium",
    minimalAnswer: "SELECT e.first_name as employee_first, e.last_name as employee_last, m.first_name as manager_first FROM employees e LEFT JOIN employees m ON e.manager_id = m.employee_id WHERE e.manager_id IS NOT NULL;",
    maximalAnswer: "SELECT e.first_name as employee_first, e.last_name as employee_last, m.first_name as manager_first, e.employee_id, e.title, m.last_name as manager_last FROM employees e LEFT JOIN employees m ON e.manager_id = m.employee_id WHERE e.manager_id IS NOT NULL;",
    solved: 0
  },
  {
  id: 9,
  title: "Top 5 Best Selling Products",
  question: "Find the top 5 best-selling products by total quantity ordered. Show product name and total quantity sold.",
  difficulty: "Medium",
  minimalAnswer: "SELECT p.product_name, SUM(od.quantity) as total_quantity FROM products p JOIN order_details od ON p.product_id = od.product_id GROUP BY p.product_id ORDER BY total_quantity DESC LIMIT 5;",
  maximalAnswer: "SELECT p.product_name, SUM(od.quantity) as total_quantity, p.product_id, p.category FROM products p JOIN order_details od ON p.product_id = od.product_id GROUP BY p.product_id ORDER BY total_quantity DESC LIMIT 5;",
  solved: 0
},
  {
    id: 10,
    title: "High Value Orders",
    question: "Find orders with total value (excluding freight) greater than $1000. Show order ID and total order value.",
    difficulty: "Medium",
    minimalAnswer: "SELECT od.order_id, SUM(od.unit_price * od.quantity * (1 - od.discount)) as total_value FROM order_details od GROUP BY od.order_id HAVING SUM(od.unit_price * od.quantity * (1 - od.discount)) > 1000;",
    maximalAnswer: "SELECT od.order_id, SUM(od.unit_price * od.quantity * (1 - od.discount)) as total_value, COUNT(od.product_id) as item_count, SUM(od.quantity) as total_items FROM order_details od GROUP BY od.order_id HAVING SUM(od.unit_price * od.quantity * (1 - od.discount)) > 1000 ORDER BY total_value DESC;",
    solved: 0
  },
  {
    id: 11,
    title: "Supplier Product Value",
    question: "Calculate total inventory value (stock_quantity * cost) by supplier. Show supplier company name and total inventory value.",
    difficulty: "Hard",
    minimalAnswer: "SELECT s.company_name, SUM(p.stock_quantity * p.cost) as inventory_value FROM suppliers s JOIN products p ON s.supplier_id = p.supplier_id GROUP BY s.supplier_id ORDER BY inventory_value DESC;",
    maximalAnswer: "SELECT s.company_name, SUM(p.stock_quantity * p.cost) as inventory_value, s.supplier_id, s.rating, COUNT(p.product_id) as product_count FROM suppliers s JOIN products p ON s.supplier_id = p.supplier_id GROUP BY s.supplier_id ORDER BY inventory_value DESC;",
    solved: 0
  },
  {
    id: 12,
    title: "Monthly Sales Trend",
    question: "Calculate monthly sales totals. Show month (YYYY-MM format) and total sales amount.",
    difficulty: "Hard",
    minimalAnswer: "SELECT strftime('%Y-%m', o.order_date) as month, SUM(od.unit_price * od.quantity * (1 - od.discount)) as monthly_sales FROM orders o JOIN order_details od ON o.order_id = od.order_id GROUP BY strftime('%Y-%m', o.order_date) ORDER BY month;",
    maximalAnswer: "SELECT strftime('%Y-%m', o.order_date) as month, SUM(od.unit_price * od.quantity * (1 - od.discount)) as monthly_sales, COUNT(DISTINCT o.order_id) as order_count, SUM(od.quantity) as items_sold FROM orders o JOIN order_details od ON o.order_id = od.order_id GROUP BY strftime('%Y-%m', o.order_date) ORDER BY month;",
    solved: 0
  },
  {
    id: 13,
    title: "Multi-Category Customers",
    question: "Find customers who have ordered products from at least 2 different categories. Show customer first name, last name, and number of distinct categories ordered.",
    difficulty: "Hard",
    minimalAnswer: "SELECT c.first_name, c.last_name, COUNT(DISTINCT p.category) as category_count FROM customers c JOIN orders o ON c.customer_id = o.customer_id JOIN order_details od ON o.order_id = od.order_id JOIN products p ON od.product_id = p.product_id GROUP BY c.customer_id HAVING COUNT(DISTINCT p.category) >= 2;",
    maximalAnswer: "SELECT c.first_name, c.last_name, COUNT(DISTINCT p.category) as category_count, c.customer_id, c.loyalty_tier FROM customers c JOIN orders o ON c.customer_id = o.customer_id JOIN order_details od ON o.order_id = od.order_id JOIN products p ON od.product_id = p.product_id GROUP BY c.customer_id HAVING COUNT(DISTINCT p.category) >= 2 ORDER BY category_count DESC;",
    solved: 0
  },
  {
    id: 14,
    title: "Above Average Employee Sales",
    question: "Find sales employees whose total sales exceed the average sales of all sales employees. Show employee first name, last name, and their total sales.",
    difficulty: "Hard",
    minimalAnswer: "SELECT e.first_name, e.last_name, SUM(od.unit_price * od.quantity * (1 - od.discount)) as total_sales FROM employees e JOIN orders o ON e.employee_id = o.employee_id JOIN order_details od ON o.order_id = od.order_id WHERE e.department = 'Sales' GROUP BY e.employee_id HAVING total_sales > (SELECT AVG(dept_sales) FROM (SELECT SUM(od2.unit_price * od2.quantity * (1 - od2.discount)) as dept_sales FROM employees e2 JOIN orders o2 ON e2.employee_id = o2.employee_id JOIN order_details od2 ON o2.order_id = od2.order_id WHERE e2.department = 'Sales' GROUP BY e2.employee_id));",
    maximalAnswer: "SELECT e.first_name, e.last_name, SUM(od.unit_price * od.quantity * (1 - od.discount)) as total_sales, e.employee_id, e.title FROM employees e JOIN orders o ON e.employee_id = o.employee_id JOIN order_details od ON o.order_id = od.order_id WHERE e.department = 'Sales' GROUP BY e.employee_id HAVING total_sales > (SELECT AVG(dept_sales) FROM (SELECT SUM(od2.unit_price * od2.quantity * (1 - od2.discount)) as dept_sales FROM employees e2 JOIN orders o2 ON e2.employee_id = o2.employee_id JOIN order_details od2 ON o2.order_id = od2.order_id WHERE e2.department = 'Sales' GROUP BY e2.employee_id)) ORDER BY total_sales DESC;",
    solved: 0
  },
  {
    id: 15,
    title: "Inventory Turnover Ratio",
    question: "Calculate inventory turnover ratio (total quantity sold / average stock quantity) for each product category. Show category and turnover ratio.",
    difficulty: "Hard",
    minimalAnswer: "SELECT p.category as a, ROUND(SUM(od.quantity) * 1.0 / AVG(p.stock_quantity), 2) as turnover_ratio FROM products p JOIN order_details od ON p.product_id = od.product_id GROUP BY p.category HAVING AVG(p.stock_quantity) > 0 ORDER BY turnover_ratio DESC;",
    maximalAnswer: "SELECT p.category, ROUND(SUM(od.quantity) * 1.0 / AVG(p.stock_quantity), 2) as turnover_ratio, SUM(od.quantity) as total_sold, AVG(p.stock_quantity) as avg_stock FROM products p JOIN order_details od ON p.product_id = od.product_id WHERE p.discontinued = FALSE GROUP BY p.category HAVING AVG(p.stock_quantity) > 0 ORDER BY turnover_ratio DESC;",
    solved: 0
  }
];

export default questions;