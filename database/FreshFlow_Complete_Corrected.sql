/* =====================================================================
   FRESHFLOW - PERISHABLE STOCK MONITORING & WASTE REDUCTION SYSTEM
   COMPLETE, CORRECTED MYSQL SCRIPT: DDL + DML + ADVANCED SQL
   Compatible with MySQL 8.0.16+

   HOW TO RUN:
   1. Open MySQL Workbench (or MySQL command line).
   2. Open this file and execute the ENTIRE script from top to bottom.
   3. This is a fresh-install script. It DROPS the existing freshflow
      database before recreating it. BACK UP anything important first.
   4. Do not execute individual INSERT sections repeatedly.

   IMPORTANT CORRECTIONS:
   - All sample foreign keys use IDs generated in this fresh database.
   - Triggers are created BEFORE waste sample rows are inserted.
   - Waste automatically decreases inventory and creates OUT movements.
   - Initial IN movements are recorded once; no duplicate manual fixes.
   - Procedure and transaction examples use valid IDs selected from data.
   - Transaction rollback test rolls back both inventory and movement rows.
   ===================================================================== */

/* ========================== 0. RESET DATABASE ======================== */
DROP DATABASE IF EXISTS freshflow;
CREATE DATABASE freshflow;
USE freshflow;

/* ============================== 1. DDL =============================== */

CREATE TABLE supplier (
    Supplier_ID INT AUTO_INCREMENT PRIMARY KEY,
    Supplier_Name VARCHAR(150) NOT NULL,
    Contact_Person VARCHAR(100),
    Phone_Number VARCHAR(20),
    Email VARCHAR(150),
    Address VARCHAR(255),
    City VARCHAR(100)
) ENGINE=InnoDB;

CREATE TABLE location (
    Location_ID INT AUTO_INCREMENT PRIMARY KEY,
    Location_Name VARCHAR(150) NOT NULL,
    Type VARCHAR(30) NOT NULL,
    Address VARCHAR(255),
    City VARCHAR(100),
    Room_Area DECIMAL(10,2),
    Temperature_Range VARCHAR(50),
    CONSTRAINT chk_location_type CHECK (Type IN ('Warehouse','Store'))
) ENGINE=InnoDB;

CREATE TABLE product (
    Product_ID INT AUTO_INCREMENT PRIMARY KEY,
    Product_Name VARCHAR(150) NOT NULL,
    Category VARCHAR(100) NOT NULL,
    Unit_of_Measure VARCHAR(50) NOT NULL,
    Shelf_Life_Days INT NOT NULL,
    Description TEXT,
    Supplier_ID INT NOT NULL,
    CONSTRAINT chk_product_shelf_life CHECK (Shelf_Life_Days > 0),
    CONSTRAINT fk_product_supplier FOREIGN KEY (Supplier_ID)
        REFERENCES supplier(Supplier_ID)
) ENGINE=InnoDB;

CREATE TABLE inventory (
    Inventory_ID INT AUTO_INCREMENT PRIMARY KEY,
    Product_ID INT NOT NULL,
    Location_ID INT NOT NULL,
    Batch_Number VARCHAR(100) NOT NULL,
    Mfg_Date DATE NOT NULL,
    Expiry_Date DATE NOT NULL,
    Quantity_On_Hand DECIMAL(12,2) NOT NULL,
    Reorder_Level DECIMAL(12,2) NOT NULL DEFAULT 0,
    Unit_Cost DECIMAL(12,2) NOT NULL,
    CONSTRAINT fk_inventory_product FOREIGN KEY (Product_ID)
        REFERENCES product(Product_ID),
    CONSTRAINT fk_inventory_location FOREIGN KEY (Location_ID)
        REFERENCES location(Location_ID),
    CONSTRAINT chk_inventory_quantity CHECK (Quantity_On_Hand >= 0),
    CONSTRAINT chk_inventory_reorder CHECK (Reorder_Level >= 0),
    CONSTRAINT chk_inventory_cost CHECK (Unit_Cost >= 0),
    CONSTRAINT chk_inventory_dates CHECK (Expiry_Date >= Mfg_Date)
) ENGINE=InnoDB;

CREATE TABLE purchase (
    Purchase_ID INT AUTO_INCREMENT PRIMARY KEY,
    Supplier_ID INT NOT NULL,
    Purchase_Date DATE NOT NULL,
    Total_Amount DECIMAL(12,2) NOT NULL,
    Payment_Status VARCHAR(30) NOT NULL,
    CONSTRAINT fk_purchase_supplier FOREIGN KEY (Supplier_ID)
        REFERENCES supplier(Supplier_ID),
    CONSTRAINT chk_purchase_amount CHECK (Total_Amount >= 0),
    CONSTRAINT chk_purchase_payment_status
        CHECK (Payment_Status IN ('Pending','Partial','Paid'))
) ENGINE=InnoDB;

CREATE TABLE purchase_item (
    Purchase_ID INT NOT NULL,
    Product_ID INT NOT NULL,
    Quantity DECIMAL(12,2) NOT NULL,
    Unit_Cost DECIMAL(12,2) NOT NULL,
    Total_Cost DECIMAL(12,2) NOT NULL,
    CONSTRAINT pk_purchase_item PRIMARY KEY (Purchase_ID, Product_ID),
    CONSTRAINT fk_purchase_item_purchase FOREIGN KEY (Purchase_ID)
        REFERENCES purchase(Purchase_ID),
    CONSTRAINT fk_purchase_item_product FOREIGN KEY (Product_ID)
        REFERENCES product(Product_ID),
    CONSTRAINT chk_purchase_item_quantity CHECK (Quantity > 0),
    CONSTRAINT chk_purchase_item_unit_cost CHECK (Unit_Cost >= 0),
    CONSTRAINT chk_purchase_item_total_cost CHECK (Total_Cost >= 0)
) ENGINE=InnoDB;

CREATE TABLE alert (
    Alert_ID INT AUTO_INCREMENT PRIMARY KEY,
    Inventory_ID INT NOT NULL,
    Alert_Type VARCHAR(50) NOT NULL,
    Alert_Date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Message TEXT NOT NULL,
    Status VARCHAR(30) NOT NULL DEFAULT 'Active',
    CONSTRAINT fk_alert_inventory FOREIGN KEY (Inventory_ID)
        REFERENCES inventory(Inventory_ID),
    CONSTRAINT chk_alert_status CHECK (Status IN ('Active','Read','Resolved'))
) ENGINE=InnoDB;

CREATE TABLE stock_movement (
    Movement_ID INT AUTO_INCREMENT PRIMARY KEY,
    Inventory_ID INT NOT NULL,
    Movement_Type VARCHAR(30) NOT NULL,
    Movement_Date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Quantity DECIMAL(12,2) NOT NULL,
    Reference_ID INT,
    Notes TEXT,
    CONSTRAINT fk_stock_movement_inventory FOREIGN KEY (Inventory_ID)
        REFERENCES inventory(Inventory_ID),
    CONSTRAINT chk_stock_movement_type
        CHECK (Movement_Type IN ('IN','OUT','ADJUSTMENT')),
    CONSTRAINT chk_stock_movement_quantity CHECK (Quantity > 0)
) ENGINE=InnoDB;

CREATE TABLE waste (
    Waste_ID INT AUTO_INCREMENT PRIMARY KEY,
    Inventory_ID INT NOT NULL,
    Waste_Date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Quantity_Wasted DECIMAL(12,2) NOT NULL,
    Reason VARCHAR(150) NOT NULL,
    Disposal_Method VARCHAR(100),
    Remarks TEXT,
    CONSTRAINT fk_waste_inventory FOREIGN KEY (Inventory_ID)
        REFERENCES inventory(Inventory_ID),
    CONSTRAINT chk_waste_quantity CHECK (Quantity_Wasted > 0)
) ENGINE=InnoDB;

CREATE TABLE role (
    Role_ID INT AUTO_INCREMENT PRIMARY KEY,
    Role_Name VARCHAR(50) NOT NULL UNIQUE,
    Description TEXT
) ENGINE=InnoDB;

CREATE TABLE `user` (
    User_ID INT AUTO_INCREMENT PRIMARY KEY,
    Full_Name VARCHAR(150) NOT NULL,
    Email VARCHAR(150) NOT NULL UNIQUE,
    Phone_Number VARCHAR(20),
    Password_Hash VARCHAR(255) NOT NULL,
    Role_ID INT NOT NULL,
    Status VARCHAR(30) NOT NULL DEFAULT 'Active',
    CONSTRAINT fk_user_role FOREIGN KEY (Role_ID) REFERENCES role(Role_ID),
    CONSTRAINT chk_user_status CHECK (Status IN ('Active','Inactive'))
) ENGINE=InnoDB;

CREATE TABLE payment (
    Payment_ID INT AUTO_INCREMENT PRIMARY KEY,
    Purchase_ID INT NOT NULL,
    Payment_Date DATE NOT NULL,
    Amount DECIMAL(12,2) NOT NULL,
    Payment_Method VARCHAR(50) NOT NULL,
    Paid_By VARCHAR(150),
    CONSTRAINT fk_payment_purchase FOREIGN KEY (Purchase_ID)
        REFERENCES purchase(Purchase_ID),
    CONSTRAINT chk_payment_amount CHECK (Amount > 0)
) ENGINE=InnoDB;

CREATE TABLE report (
    Report_ID INT AUTO_INCREMENT PRIMARY KEY,
    Report_Type VARCHAR(100) NOT NULL,
    Generated_Date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Generated_By INT NOT NULL,
    From_Date DATE,
    To_Date DATE,
    File_Path VARCHAR(500),
    CONSTRAINT fk_report_user FOREIGN KEY (Generated_By)
        REFERENCES `user`(User_ID),
    CONSTRAINT chk_report_dates CHECK
        (To_Date IS NULL OR From_Date IS NULL OR To_Date >= From_Date)
) ENGINE=InnoDB;

/* Indexes */
CREATE INDEX idx_product_supplier ON product(Supplier_ID);
CREATE INDEX idx_inventory_product ON inventory(Product_ID);
CREATE INDEX idx_inventory_location ON inventory(Location_ID);
CREATE INDEX idx_inventory_expiry ON inventory(Expiry_Date);
CREATE INDEX idx_inventory_batch ON inventory(Batch_Number);
CREATE INDEX idx_purchase_supplier ON purchase(Supplier_ID);
CREATE INDEX idx_purchase_date ON purchase(Purchase_Date);
CREATE INDEX idx_alert_inventory ON alert(Inventory_ID);
CREATE INDEX idx_alert_status ON alert(Status);
CREATE INDEX idx_stock_movement_inventory ON stock_movement(Inventory_ID);
CREATE INDEX idx_stock_movement_date ON stock_movement(Movement_Date);
CREATE INDEX idx_waste_inventory ON waste(Inventory_ID);
CREATE INDEX idx_waste_date ON waste(Waste_Date);
CREATE INDEX idx_payment_purchase ON payment(Purchase_ID);
CREATE INDEX idx_report_generated_by ON report(Generated_By);

/* ===================== 2. ADVANCED: TRIGGERS =========================
   Create triggers BEFORE inserting waste rows, so sample waste is
   processed exactly like real waste records. */
DELIMITER $$

CREATE TRIGGER trg_before_waste_insert
BEFORE INSERT ON waste
FOR EACH ROW
BEGIN
    DECLARE available_quantity DECIMAL(12,2);
    DECLARE inventory_exists INT DEFAULT 0;

    SELECT COUNT(*) INTO inventory_exists
    FROM inventory
    WHERE Inventory_ID = NEW.Inventory_ID;

    IF inventory_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Inventory record does not exist';
    END IF;

    SELECT Quantity_On_Hand INTO available_quantity
    FROM inventory
    WHERE Inventory_ID = NEW.Inventory_ID;

    IF NEW.Quantity_Wasted > available_quantity THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Waste quantity cannot exceed available stock';
    END IF;
END$$

CREATE TRIGGER trg_after_waste_insert
AFTER INSERT ON waste
FOR EACH ROW
BEGIN
    UPDATE inventory
    SET Quantity_On_Hand = Quantity_On_Hand - NEW.Quantity_Wasted
    WHERE Inventory_ID = NEW.Inventory_ID;

    INSERT INTO stock_movement
        (Inventory_ID, Movement_Type, Movement_Date, Quantity, Reference_ID, Notes)
    VALUES
        (NEW.Inventory_ID, 'OUT', NOW(), NEW.Quantity_Wasted, NEW.Waste_ID,
         CONCAT('Stock reduced due to waste. Reason: ', NEW.Reason));
END$$

DELIMITER ;

/* ============================== 3. DML =============================== */

/* 3.1 Supplier */
INSERT INTO supplier
(Supplier_Name, Contact_Person, Phone_Number, Email, Address, City) VALUES
('Fresh Dairy Suppliers','Ramesh Kumar','9876543210','freshdairy@gmail.com','12 Market Road','Bengaluru'),
('Green Farm Suppliers','Anita Rao','9876543211','greenfarm@gmail.com','25 Farm Road','Mysuru'),
('Daily Fresh Foods','Suresh Patel','9876543212','dailyfresh@gmail.com','18 Main Street','Bengaluru'),
('Organic Harvest','Meena Sharma','9876543213','organicharvest@gmail.com','45 MG Road','Tumakuru');

/* 3.2 Location */
INSERT INTO location
(Location_Name, Type, Address, City, Room_Area, Temperature_Range) VALUES
('Main Warehouse','Warehouse','Industrial Area','Bengaluru',2500.00,'2-8 C'),
('Cold Storage Room','Warehouse','Food Market Area','Bengaluru',1200.00,'0-5 C'),
('Main Store','Store','MG Road','Bengaluru',800.00,'10-20 C'),
('Campus Cafeteria Store','Store','PES University','Bengaluru',500.00,'10-25 C');

/* 3.3 Product */
INSERT INTO product
(Product_Name, Category, Unit_of_Measure, Shelf_Life_Days, Description, Supplier_ID) VALUES
('Milk','Dairy','Litres',7,'Fresh pasteurized milk',1),
('Bread','Bakery','Packets',5,'Fresh wheat bread',2),
('Paneer','Dairy','Kg',10,'Fresh cottage cheese',1),
('Yogurt','Dairy','Cups',14,'Plain fresh yogurt',3),
('Fresh Cream','Dairy','Litres',10,'Fresh dairy cream',4);

/* 3.4 Roles and users */
INSERT INTO role (Role_Name, Description) VALUES
('ADMIN','Full system administrator'),
('STAFF','Inventory management staff'),
('MANAGER','Business and inventory manager');

INSERT INTO `user`
(Full_Name, Email, Phone_Number, Password_Hash, Role_ID, Status) VALUES
('Keerthana M','keerthana@example.com','9876500001','demo_hash_001',1,'Active'),
('Ananya Rao','ananya@example.com','9876500002','demo_hash_002',2,'Active'),
('Rahul Kumar','rahul@example.com','9876500003','demo_hash_003',2,'Active'),
('Sneha Patel','sneha@example.com','9876500004','demo_hash_004',3,'Active');

/* 3.5 Inventory: fresh database generates Inventory_ID values 1 to 6. */
INSERT INTO inventory
(Product_ID, Location_ID, Batch_Number, Mfg_Date, Expiry_Date,
 Quantity_On_Hand, Reorder_Level, Unit_Cost) VALUES
(1,1,'MILK-B001','2026-10-28','2026-11-04',100.00,20.00,45.00),
(1,2,'MILK-B002','2026-10-30','2026-11-08',80.00,20.00,45.00),
(2,3,'BREAD-B001','2026-10-29','2026-11-03',60.00,15.00,35.00),
(3,2,'PANEER-B001','2026-10-30','2026-11-09',40.00,10.00,280.00),
(4,3,'YOG-B001','2026-10-25','2026-11-09',50.00,10.00,40.00),
(5,2,'CREAM-B001','2026-10-30','2026-11-10',30.00,5.00,180.00);

/* 3.6 Purchases and purchase items */
INSERT INTO purchase (Supplier_ID, Purchase_Date, Total_Amount, Payment_Status) VALUES
(1,'2026-10-28',4500.00,'Paid'),
(2,'2026-10-29',2100.00,'Paid'),
(3,'2026-10-30',2000.00,'Partial'),
(4,'2026-10-31',5400.00,'Pending');

INSERT INTO purchase_item
(Purchase_ID, Product_ID, Quantity, Unit_Cost, Total_Cost) VALUES
(1,1,100.00,45.00,4500.00),
(2,2,60.00,35.00,2100.00),
(3,4,50.00,40.00,2000.00),
(4,5,30.00,180.00,5400.00);

/* 3.7 Alerts: IDs reference the six inventory rows above. */
INSERT INTO alert (Inventory_ID, Alert_Type, Message, Status) VALUES
(1,'EXPIRY_WARNING','Milk batch MILK-B001 expires soon','Active'),
(2,'EXPIRY_WARNING','Milk batch MILK-B002 is approaching expiry','Active'),
(3,'LOW_STOCK','Bread stock is approaching reorder level','Active'),
(5,'EXPIRY_WARNING','Yogurt batch YOG-B001 expires soon','Read');

/* 3.8 Initial stock IN movements (one per inventory batch). */
INSERT INTO stock_movement
(Inventory_ID, Movement_Type, Quantity, Reference_ID, Notes) VALUES
(1,'IN',100.00,1,'Initial milk stock received'),
(2,'IN',80.00,1,'Second milk batch received'),
(3,'IN',60.00,2,'Bread stock received'),
(4,'IN',40.00,3,'Paneer stock received'),
(5,'IN',50.00,3,'Yogurt stock received'),
(6,'IN',30.00,4,'Fresh cream stock received');

/* 3.9 Waste rows: triggers reduce inventory and add OUT movements. */
INSERT INTO waste
(Inventory_ID, Quantity_Wasted, Reason, Disposal_Method, Remarks) VALUES
(1,5.00,'Expired product','Discarded','Milk expired before sale'),
(3,4.00,'Product quality issue','Compost','Bread expired'),
(5,3.00,'Damaged packaging','Discarded','Yogurt packaging damaged');

/* 3.10 Payments and reports */
INSERT INTO payment (Purchase_ID, Payment_Date, Amount, Payment_Method, Paid_By) VALUES
(1,'2026-10-28',4500.00,'UPI','Keerthana M'),
(2,'2026-10-29',2100.00,'Bank Transfer','Ananya Rao'),
(3,'2026-10-30',1000.00,'Cash','Rahul Kumar');

INSERT INTO report (Report_Type, Generated_By, From_Date, To_Date, File_Path) VALUES
('Inventory Summary',1,'2026-10-01','2026-10-31','/reports/inventory_october.pdf'),
('Waste Analysis',1,'2026-10-01','2026-10-31','/reports/waste_october.pdf'),
('Expiry Report',4,'2026-11-01','2026-11-30','/reports/expiry_november.pdf');

/* 3.11 UPDATE examples */
UPDATE alert SET Status='Resolved' WHERE Alert_ID=1;
UPDATE purchase SET Payment_Status='Paid' WHERE Purchase_ID=3;

/* 3.12 DELETE example: insert a temporary row, then delete it. */
INSERT INTO payment (Purchase_ID, Payment_Date, Amount, Payment_Method, Paid_By)
VALUES (4,'2026-11-01',500.00,'Cash','Temporary Test Record');
DELETE FROM payment WHERE Paid_By='Temporary Test Record';

/* =========================== 4. DML QUERIES =========================== */

/* Basic SELECT and ORDER BY */
SELECT Product_Name, Category, Shelf_Life_Days, Unit_of_Measure
FROM product ORDER BY Shelf_Life_Days ASC;

/* JOIN 1: Product and supplier */
SELECT p.Product_ID, p.Product_Name, p.Category, s.Supplier_Name, s.City
FROM product p INNER JOIN supplier s ON p.Supplier_ID=s.Supplier_ID;

/* JOIN 2: Inventory, product and location */
SELECT i.Inventory_ID, p.Product_Name, i.Batch_Number, l.Location_Name,
       i.Quantity_On_Hand, i.Expiry_Date
FROM inventory i
JOIN product p ON i.Product_ID=p.Product_ID
JOIN location l ON i.Location_ID=l.Location_ID;

/* JOIN 3: Waste, inventory and product */
SELECT w.Waste_ID, p.Product_Name, w.Quantity_Wasted, w.Reason, w.Waste_Date
FROM waste w
JOIN inventory i ON w.Inventory_ID=i.Inventory_ID
JOIN product p ON i.Product_ID=p.Product_ID;

/* Aggregate functions */
SELECT COUNT(*) AS total_products,
       AVG(Shelf_Life_Days) AS average_shelf_life,
       MAX(Shelf_Life_Days) AS maximum_shelf_life,
       MIN(Shelf_Life_Days) AS minimum_shelf_life
FROM product;

SELECT SUM(Quantity_On_Hand) AS total_stock,
       AVG(Quantity_On_Hand) AS average_stock,
       MAX(Quantity_On_Hand) AS maximum_stock,
       MIN(Quantity_On_Hand) AS minimum_stock
FROM inventory;

/* GROUP BY */
SELECT p.Product_Name, SUM(i.Quantity_On_Hand) AS total_quantity
FROM inventory i JOIN product p ON i.Product_ID=p.Product_ID
GROUP BY p.Product_ID, p.Product_Name;

/* GROUP BY + HAVING */
SELECT p.Product_Name, SUM(w.Quantity_Wasted) AS total_waste
FROM waste w
JOIN inventory i ON w.Inventory_ID=i.Inventory_ID
JOIN product p ON i.Product_ID=p.Product_ID
GROUP BY p.Product_ID, p.Product_Name
HAVING SUM(w.Quantity_Wasted)>3;

/* Subquery 1: Products with shelf life greater than average */
SELECT Product_Name, Shelf_Life_Days
FROM product
WHERE Shelf_Life_Days > (SELECT AVG(Shelf_Life_Days) FROM product);

/* Subquery 2: Inventory batches with quantity greater than average */
SELECT Inventory_ID, Batch_Number, Quantity_On_Hand
FROM inventory
WHERE Quantity_On_Hand > (SELECT AVG(Quantity_On_Hand) FROM inventory);

/* Complex query: JOIN + GROUP BY + HAVING + ORDER BY + aggregates */
SELECT p.Product_Name, p.Category,
       COUNT(w.Waste_ID) AS number_of_waste_records,
       SUM(w.Quantity_Wasted) AS total_quantity_wasted,
       AVG(w.Quantity_Wasted) AS average_quantity_wasted
FROM product p
JOIN inventory i ON p.Product_ID=i.Product_ID
JOIN waste w ON i.Inventory_ID=w.Inventory_ID
GROUP BY p.Product_ID, p.Product_Name, p.Category
HAVING SUM(w.Quantity_Wasted)>2
ORDER BY total_quantity_wasted DESC;

/* Expiring stock within the next seven days */
SELECT p.Product_Name, i.Batch_Number, i.Quantity_On_Hand, i.Expiry_Date
FROM inventory i JOIN product p ON i.Product_ID=p.Product_ID
WHERE i.Expiry_Date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
ORDER BY i.Expiry_Date ASC;

/* Waste analysis */
SELECT p.Product_Name, SUM(w.Quantity_Wasted) AS total_wasted
FROM waste w
JOIN inventory i ON w.Inventory_ID=i.Inventory_ID
JOIN product p ON i.Product_ID=p.Product_ID
GROUP BY p.Product_ID, p.Product_Name
ORDER BY total_wasted DESC;

/* ============================== 5. VIEWS ============================= */
CREATE VIEW vw_inventory_status AS
SELECT i.Inventory_ID, p.Product_Name, p.Category, l.Location_Name,
       i.Batch_Number, i.Expiry_Date, i.Quantity_On_Hand, i.Reorder_Level,
       CASE WHEN i.Quantity_On_Hand <= i.Reorder_Level
            THEN 'LOW STOCK' ELSE 'AVAILABLE' END AS Stock_Status,
       CASE WHEN i.Expiry_Date < CURDATE() THEN 'EXPIRED'
            WHEN i.Expiry_Date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            THEN 'EXPIRING SOON'
            ELSE 'NOT NEAR EXPIRY' END AS Expiry_Status
FROM inventory i
JOIN product p ON p.Product_ID=i.Product_ID
JOIN location l ON l.Location_ID=i.Location_ID;

CREATE VIEW vw_waste_summary AS
SELECT w.Waste_ID, w.Waste_Date, p.Product_Name, i.Batch_Number,
       w.Quantity_Wasted, w.Reason, w.Disposal_Method, i.Unit_Cost,
       ROUND(w.Quantity_Wasted * i.Unit_Cost, 2) AS Estimated_Waste_Value
FROM waste w
JOIN inventory i ON i.Inventory_ID=w.Inventory_ID
JOIN product p ON p.Product_ID=i.Product_ID;

/* ========================= 6. STORED PROCEDURES ====================== */
DELIMITER $$

CREATE PROCEDURE sp_record_stock_in(
    IN p_inventory_id INT,
    IN p_quantity DECIMAL(12,2),
    IN p_notes VARCHAR(255)
)
BEGIN
    DECLARE inventory_exists INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Stock-in quantity must be greater than zero';
    END IF;

    START TRANSACTION;

    SELECT COUNT(*) INTO inventory_exists
    FROM inventory WHERE Inventory_ID=p_inventory_id;

    IF inventory_exists=0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Inventory ID not found';
    END IF;

    UPDATE inventory
    SET Quantity_On_Hand=Quantity_On_Hand+p_quantity
    WHERE Inventory_ID=p_inventory_id;

    INSERT INTO stock_movement (Inventory_ID, Movement_Type, Quantity, Notes)
    VALUES (p_inventory_id, 'IN', p_quantity, p_notes);

    COMMIT;
END$$

CREATE PROCEDURE sp_get_expiring_stock(IN p_days INT)
BEGIN
    IF p_days IS NULL OR p_days < 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Number of days must be zero or greater';
    END IF;

    SELECT i.Inventory_ID, p.Product_Name, i.Batch_Number, i.Expiry_Date,
           i.Quantity_On_Hand,
           DATEDIFF(i.Expiry_Date, CURDATE()) AS Days_To_Expiry
    FROM inventory i
    JOIN product p ON p.Product_ID=i.Product_ID
    WHERE i.Expiry_Date BETWEEN CURDATE()
                            AND DATE_ADD(CURDATE(), INTERVAL p_days DAY)
    ORDER BY i.Expiry_Date;
END$$

DELIMITER ;

/* ========================== 7. TRANSACTIONS ========================== */

/* 7.1 COMMIT example: update stock and record movement atomically. */
START TRANSACTION;

SET @transaction_inventory_id = (SELECT MIN(Inventory_ID) FROM inventory);

SELECT Inventory_ID, Quantity_On_Hand
FROM inventory
WHERE Inventory_ID=@transaction_inventory_id
FOR UPDATE;

UPDATE inventory
SET Quantity_On_Hand=Quantity_On_Hand+2.00
WHERE Inventory_ID=@transaction_inventory_id;

INSERT INTO stock_movement (Inventory_ID, Movement_Type, Quantity, Notes)
VALUES (@transaction_inventory_id, 'IN', 2.00,
        'Transaction demonstration: committed stock adjustment');

COMMIT;

/* 7.2 ROLLBACK example: both changes below should disappear. */
SET @rollback_inventory_id = (SELECT MIN(Inventory_ID) FROM inventory);

START TRANSACTION;

UPDATE inventory
SET Quantity_On_Hand=Quantity_On_Hand+10.00
WHERE Inventory_ID=@rollback_inventory_id;

INSERT INTO stock_movement (Inventory_ID, Movement_Type, Quantity, Notes)
VALUES (@rollback_inventory_id, 'IN', 10.00,
        'ROLLBACK TEST - this record should not remain');

SELECT Inventory_ID, Quantity_On_Hand
FROM inventory WHERE Inventory_ID=@rollback_inventory_id;

ROLLBACK;

/* Expected: quantity is restored and this query returns Empty set. */
SELECT Inventory_ID, Quantity_On_Hand
FROM inventory WHERE Inventory_ID=@rollback_inventory_id;

SELECT * FROM stock_movement
WHERE Notes='ROLLBACK TEST - this record should not remain';

/* ========================= 8. PROCEDURE TESTS ======================== */
/* This test adds 1 unit to inventory ID 1 and records an IN movement. */
CALL sp_record_stock_in(1, 1.00, 'Stored procedure stock-in test');

/* Returns batches expiring in the next seven days. */
CALL sp_get_expiring_stock(7);

/* ========================== 9. FINAL CHECKS ========================== */
SHOW TABLES;

SELECT 'supplier' AS Table_Name, COUNT(*) AS Total_Rows FROM supplier
UNION ALL SELECT 'location', COUNT(*) FROM location
UNION ALL SELECT 'product', COUNT(*) FROM product
UNION ALL SELECT 'inventory', COUNT(*) FROM inventory
UNION ALL SELECT 'purchase', COUNT(*) FROM purchase
UNION ALL SELECT 'purchase_item', COUNT(*) FROM purchase_item
UNION ALL SELECT 'alert', COUNT(*) FROM alert
UNION ALL SELECT 'stock_movement', COUNT(*) FROM stock_movement
UNION ALL SELECT 'waste', COUNT(*) FROM waste
UNION ALL SELECT 'role', COUNT(*) FROM role
UNION ALL SELECT 'user', COUNT(*) FROM `user`
UNION ALL SELECT 'payment', COUNT(*) FROM payment
UNION ALL SELECT 'report', COUNT(*) FROM report;

SHOW TRIGGERS;
SHOW FULL TABLES WHERE Table_type='VIEW';
SHOW PROCEDURE STATUS WHERE Db='freshflow';

SELECT * FROM vw_inventory_status;
SELECT * FROM vw_waste_summary;
SELECT * FROM stock_movement ORDER BY Movement_ID;

/* ============================ END SCRIPT ============================= */
