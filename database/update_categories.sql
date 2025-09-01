-- Update FloresYa categories with specific occasions
-- Categories requested: amor, cumpleaños, aniversario, graduación, dia amistad, condolencia, dia de la madre, flor amarilla

-- First, clear existing categories to avoid conflicts
DELETE FROM categories;

-- Insert the specific categories requested
INSERT INTO categories (name, description, image_url, active, created_at, updated_at) VALUES
('Amor', 'Arreglos florales perfectos para expresar amor y romance', '/images/categories/amor.jpg', TRUE, NOW(), NOW()),
('Cumpleaños', 'Hermosos ramos para celebrar cumpleaños y fechas especiales', '/images/categories/cumpleanos.jpg', TRUE, NOW(), NOW()),
('Aniversario', 'Flores elegantes para conmemorar aniversarios y momentos importantes', '/images/categories/aniversario.jpg', TRUE, NOW(), NOW()),
('Graduación', 'Arreglos florales para celebrar logros académicos y profesionales', '/images/categories/graduacion.jpg', TRUE, NOW(), NOW()),
('Día de la Amistad', 'Flores especiales para demostrar amistad y cariño', '/images/categories/dia-amistad.jpg', TRUE, NOW(), NOW()),
('Condolencias', 'Arreglos respetuosos para expresar condolencias y acompañamiento', '/images/categories/condolencias.jpg', TRUE, NOW(), NOW()),
('Día de la Madre', 'Flores especiales para honrar y celebrar a mamá', '/images/categories/dia-madre.jpg', TRUE, NOW(), NOW()),
('Flor Amarilla', 'Hermosas flores amarillas para alegrar cualquier ocasión', '/images/categories/flor-amarilla.jpg', TRUE, NOW(), NOW());

-- Update existing products to use the new categories
-- Map products to appropriate categories based on their occasion
UPDATE products SET category_id = 1 WHERE occasion IN ('amor', 'valentine', 'love'); -- Amor
UPDATE products SET category_id = 2 WHERE occasion IN ('birthday', 'cumpleanos'); -- Cumpleaños  
UPDATE products SET category_id = 3 WHERE occasion IN ('anniversary', 'aniversario'); -- Aniversario
UPDATE products SET category_id = 4 WHERE occasion IN ('graduation', 'graduacion'); -- Graduación
UPDATE products SET category_id = 5 WHERE occasion IN ('friendship', 'amistad'); -- Día de la Amistad
UPDATE products SET category_id = 6 WHERE occasion IN ('funeral', 'condolencia'); -- Condolencias
UPDATE products SET category_id = 7 WHERE occasion IN ('mother', 'mothers_day', 'dia_madre'); -- Día de la Madre
UPDATE products SET category_id = 8 WHERE occasion IN ('yellow_flower', 'flor_amarilla'); -- Flor Amarilla

-- Add some sample products for each category if they don't exist
INSERT INTO products (name, description, price, category_id, stock_quantity, image_url, occasion, featured, created_at, updated_at) VALUES
-- Amor
('Rosas Rojas del Amor', 'Docena de rosas rojas perfectas para declarar tu amor', 35.00, 1, 25, '/images/products/rosas-rojas-amor.jpg', 'amor', TRUE, NOW(), NOW()),
('Bouquet Romántico', 'Hermoso ramo romántico con rosas y flores complementarias', 42.00, 1, 20, '/images/products/bouquet-romantico.jpg', 'amor', TRUE, NOW(), NOW()),

-- Cumpleaños  
('Ramo Cumpleañero', 'Colorido ramo de flores mixtas perfecto para cumpleaños', 28.00, 2, 30, '/images/products/ramo-cumpleanos.jpg', 'birthday', TRUE, NOW(), NOW()),
('Arreglo Festivo', 'Alegre arreglo floral para celebrar el día especial', 38.00, 2, 25, '/images/products/arreglo-festivo.jpg', 'birthday', FALSE, NOW(), NOW()),

-- Aniversario
('Elegancia Aniversario', 'Sofisticado arreglo para celebrar aniversarios importantes', 55.00, 3, 15, '/images/products/elegancia-aniversario.jpg', 'anniversary', TRUE, NOW(), NOW()),
('Rosas Blancas Aniversario', 'Clásicas rosas blancas simbolizando amor duradero', 45.00, 3, 20, '/images/products/rosas-blancas-aniversario.jpg', 'anniversary', FALSE, NOW(), NOW()),

-- Graduación
('Orgullo de Graduación', 'Arreglo especial para celebrar logros académicos', 32.00, 4, 20, '/images/products/orgullo-graduacion.jpg', 'graduation', TRUE, NOW(), NOW()),
('Éxito Floral', 'Bouquet que celebra el éxito y los nuevos comienzos', 40.00, 4, 15, '/images/products/exito-floral.jpg', 'graduation', FALSE, NOW(), NOW()),

-- Día de la Amistad
('Amistad Eterna', 'Flores que simbolizan la amistad verdadera y duradera', 25.00, 5, 35, '/images/products/amistad-eterna.jpg', 'friendship', TRUE, NOW(), NOW()),
('Colores de Amistad', 'Vibrante mezcla de colores para celebrar la amistad', 30.00, 5, 25, '/images/products/colores-amistad.jpg', 'friendship', FALSE, NOW(), NOW()),

-- Condolencias
('Paz Eterna', 'Respetuoso arreglo blanco para expresar condolencias', 65.00, 6, 10, '/images/products/paz-eterna.jpg', 'condolencia', FALSE, NOW(), NOW()),
('Memoria Floral', 'Elegante corona para honrar la memoria del ser querido', 75.00, 6, 8, '/images/products/memoria-floral.jpg', 'condolencia', FALSE, NOW(), NOW()),

-- Día de la Madre
('Amor de Madre', 'Hermoso ramo especialmente diseñado para mamá', 48.00, 7, 30, '/images/products/amor-madre.jpg', 'mother', TRUE, NOW(), NOW()),
('Ternura Maternal', 'Delicado arreglo en tonos suaves para el día de la madre', 52.00, 7, 25, '/images/products/ternura-maternal.jpg', 'mother', TRUE, NOW(), NOW()),

-- Flor Amarilla
('Alegría Amarilla', 'Radiantes flores amarillas que transmiten felicidad', 35.00, 8, 40, '/images/products/alegria-amarilla.jpg', 'yellow_flower', TRUE, NOW(), NOW()),
('Sol Floral', 'Brillante arreglo amarillo como un rayo de sol', 42.00, 8, 30, '/images/products/sol-floral.jpg', 'yellow_flower', FALSE, NOW(), NOW());