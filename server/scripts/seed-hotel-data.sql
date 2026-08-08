-- Sample hotel data (optional; run after init-hotel-schema.sql)

SET TIME ZONE 'UTC';

TRUNCATE TABLE payments, guests, bookings, room_amenities, amenities, rooms, customers RESTART IDENTITY CASCADE;

INSERT INTO customers (name, email) VALUES
('Jane Doe', 'jane.doe@example.com'),
('John Smith', 'john.smith@example.com'),
('Emily White', 'emily.white@example.com'),
('Michael Brown', 'michael.brown@example.com'),
('Sarah Davis', 'sarah.davis@example.com');

INSERT INTO rooms (room_number, room_type, price_per_night, max_occupancy, is_available) VALUES
('101', 'Single', 120.00, 1, TRUE),
('102', 'Double', 180.00, 2, TRUE),
('103', 'Suite', 350.00, 4, TRUE),
('201', 'Double', 190.00, 2, TRUE),
('202', 'Single', 130.00, 1, FALSE),
('301', 'Suite', 400.00, 5, TRUE);

INSERT INTO amenities (name, description) VALUES
('Free Wi-Fi', 'High-speed wireless internet access available throughout the hotel.'),
('Minibar', 'A private minibar stocked with beverages and snacks.'),
('Ocean View', 'A stunning view of the ocean from the room window or balcony.'),
('King-size Bed', 'A spacious king-size bed for ultimate comfort.'),
('Jacuzzi', 'A private in-room jacuzzi or hot tub.'),
('Complimentary Breakfast', 'A free continental or hot breakfast for guests.');

INSERT INTO room_amenities (room_id, amenity_id) VALUES
((SELECT room_id FROM rooms WHERE room_number = '101'), (SELECT amenity_id FROM amenities WHERE name = 'Free Wi-Fi')),
((SELECT room_id FROM rooms WHERE room_number = '102'), (SELECT amenity_id FROM amenities WHERE name = 'Free Wi-Fi')),
((SELECT room_id FROM rooms WHERE room_number = '102'), (SELECT amenity_id FROM amenities WHERE name = 'Minibar')),
((SELECT room_id FROM rooms WHERE room_number = '103'), (SELECT amenity_id FROM amenities WHERE name = 'King-size Bed')),
((SELECT room_id FROM rooms WHERE room_number = '103'), (SELECT amenity_id FROM amenities WHERE name = 'Ocean View')),
((SELECT room_id FROM rooms WHERE room_number = '103'), (SELECT amenity_id FROM amenities WHERE name = 'Jacuzzi')),
((SELECT room_id FROM rooms WHERE room_number = '301'), (SELECT amenity_id FROM amenities WHERE name = 'King-size Bed')),
((SELECT room_id FROM rooms WHERE room_number = '301'), (SELECT amenity_id FROM amenities WHERE name = 'Ocean View')),
((SELECT room_id FROM rooms WHERE room_number = '301'), (SELECT amenity_id FROM amenities WHERE name = 'Complimentary Breakfast'));

INSERT INTO bookings (customer_id, room_id, check_in_date, check_out_date, total_price, status) VALUES
((SELECT customer_id FROM customers WHERE email = 'jane.doe@example.com'),
 (SELECT room_id FROM rooms WHERE room_number = '102'),
 '2025-09-10', '2025-09-14', 720.00, 'Confirmed'),
((SELECT customer_id FROM customers WHERE email = 'john.smith@example.com'),
 (SELECT room_id FROM rooms WHERE room_number = '103'),
 '2025-09-15', '2025-09-18', 1050.00, 'Confirmed'),
((SELECT customer_id FROM customers WHERE email = 'emily.white@example.com'),
 (SELECT room_id FROM rooms WHERE room_number = '201'),
 '2025-09-20', '2025-09-22', 380.00, 'Confirmed');

INSERT INTO payments (booking_id, amount, payment_method, transaction_id) VALUES
((SELECT booking_id FROM bookings WHERE customer_id = (SELECT customer_id FROM customers WHERE email = 'jane.doe@example.com') AND room_id = (SELECT room_id FROM rooms WHERE room_number = '102')),
 720.00, 'Credit Card', 'TXN-A1B2C3D4E5'),
((SELECT booking_id FROM bookings WHERE customer_id = (SELECT customer_id FROM customers WHERE email = 'john.smith@example.com') AND room_id = (SELECT room_id FROM rooms WHERE room_number = '103')),
 1050.00, 'Debit Card', 'TXN-F6G7H8I9J0');

INSERT INTO guests (booking_id, first_name, last_name) VALUES
((SELECT booking_id FROM bookings WHERE customer_id = (SELECT customer_id FROM customers WHERE email = 'jane.doe@example.com') AND room_id = (SELECT room_id FROM rooms WHERE room_number = '102')),
 'Jane', 'Doe'),
((SELECT booking_id FROM bookings WHERE customer_id = (SELECT customer_id FROM customers WHERE email = 'jane.doe@example.com') AND room_id = (SELECT room_id FROM rooms WHERE room_number = '102')),
 'Peter', 'Doe'),
((SELECT booking_id FROM bookings WHERE customer_id = (SELECT customer_id FROM customers WHERE email = 'john.smith@example.com') AND room_id = (SELECT room_id FROM rooms WHERE room_number = '103')),
 'John', 'Smith'),
((SELECT booking_id FROM bookings WHERE customer_id = (SELECT customer_id FROM customers WHERE email = 'john.smith@example.com') AND room_id = (SELECT room_id FROM rooms WHERE room_number = '103')),
 'Sarah', 'Smith'),
((SELECT booking_id FROM bookings WHERE customer_id = (SELECT customer_id FROM customers WHERE email = 'john.smith@example.com') AND room_id = (SELECT room_id FROM rooms WHERE room_number = '103')),
 'Liam', 'Smith');
