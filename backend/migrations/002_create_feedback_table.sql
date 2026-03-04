-- Create feedback table for order ratings/comments
-- rating: required 1-5

CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    customer_id INT NOT NULL,
    rating TINYINT NOT NULL,
    comment TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_feedback_order_id_orders
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT fk_feedback_customer_id_users
        FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT uq_feedback_order_id UNIQUE (order_id),
    CONSTRAINT chk_feedback_rating CHECK (rating >= 1 AND rating <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX IF NOT EXISTS idx_feedback_order_id ON feedback(order_id);
CREATE INDEX IF NOT EXISTS idx_feedback_customer_id ON feedback(customer_id);
