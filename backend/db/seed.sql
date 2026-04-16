USE polaris_db;

-- Roles seeded via ENUM so no separate table needed

-- Users (password for all = Test@1234)
INSERT INTO Users (username, full_name, gender, date_of_birth, email, phone, address, password_hash, role, status, password_changed_at) VALUES
('john_doe', 'John Doe', 'Male', '1995-03-15', 'customer1@test.com', '+96170000001', 'Beirut, Lebanon', '$2b$10$ybA7MTb/lSl1Br1XupD3i.XothQT8HmVv/05barxx/1lesOOwp7ei', 'Customer', 'Active', NOW()),
('sara_ali', 'Sara Ali', 'Female', '1998-07-22', 'customer2@test.com', '+96170000002', 'Tripoli, Lebanon', '$2b$10$ybA7MTb/lSl1Br1XupD3i.XothQT8HmVv/05barxx/1lesOOwp7ei', 'Customer', 'Active', NOW()),
('maya_kh', 'Maya Khalil', 'Female', '2000-01-10', 'customer3@test.com', '+96170000003', 'Sidon, Lebanon', '$2b$10$ybA7MTb/lSl1Br1XupD3i.XothQT8HmVv/05barxx/1lesOOwp7ei', 'Customer', 'Active', NOW()),
('omar_hassan', 'Omar Hassan', 'Male', '1993-11-05', 'customer4@test.com', '+96170000004', 'Jounieh, Lebanon', '$2b$10$ybA7MTb/lSl1Br1XupD3i.XothQT8HmVv/05barxx/1lesOOwp7ei', 'Customer', 'Active', NOW()),
('agent_sara', 'Sara Mansour', 'Female', '1990-05-18', 'agent1@test.com', '+96170000005', 'Beirut, Lebanon', '$2b$10$ybA7MTb/lSl1Br1XupD3i.XothQT8HmVv/05barxx/1lesOOwp7ei', 'TravelAgent', 'Active', NOW()),
('agent_karim', 'Karim Nassar', 'Male', '1988-09-30', 'agent2@test.com', '+96170000006', 'Beirut, Lebanon', '$2b$10$ybA7MTb/lSl1Br1XupD3i.XothQT8HmVv/05barxx/1lesOOwp7ei', 'TravelAgent', 'Active', NOW()),
('admin_lara', 'Lara Haddad', 'Female', '1985-04-12', 'admin@test.com', '+96170000007', 'Beirut, Lebanon', '$2b$10$ybA7MTb/lSl1Br1XupD3i.XothQT8HmVv/05barxx/1lesOOwp7ei', 'Administrator', 'Active', NOW());

-- Customers extra info
INSERT INTO Customers (customer_id, passport_number, nationality, preferences) VALUES
(1, 'LB123456', 'Lebanese', 'Beach, Adventure'),
(2, 'LB234567', 'Lebanese', 'Cultural, City tours'),
(3, 'LB345678', 'Lebanese', 'Relaxation, Spa'),
(4, 'LB456789', 'Lebanese', 'Family, Nature');

-- Staff extra info
INSERT INTO Staff (staff_id, employment_type) VALUES
(5, 'Full-time'),
(6, 'Full-time');

-- Destinations
INSERT INTO Destinations (country, city, description, climate_info) VALUES
('France', 'Paris', 'The city of lights, known for art, fashion, and culture.', 'Temperate, mild summers and cool winters'),
('Indonesia', 'Bali', 'A tropical paradise with stunning beaches and rice terraces.', 'Tropical, warm all year round'),
('Japan', 'Tokyo', 'A vibrant metropolis blending tradition and modernity.', 'Humid subtropical, four distinct seasons'),
('Italy', 'Rome', 'The eternal city full of ancient history and delicious food.', 'Mediterranean, hot dry summers'),
('UAE', 'Dubai', 'A futuristic city known for luxury, shopping, and desert experiences.', 'Hot desert climate, sunny year round'),
('Greece', 'Santorini', 'Iconic white-washed buildings and breathtaking volcanic views.', 'Mediterranean, warm and sunny'),
('Thailand', 'Bangkok', 'A lively city with ornate temples, street food, and nightlife.', 'Tropical, hot and humid');

-- Hotels
INSERT INTO Hotels (hotel_name, destination_id, room_types, price_per_night, status_availability, rating) VALUES
('Le Grand Paris', 1, 'Double', 250.00, TRUE, 4.5),
('Eiffel Boutique Hotel', 1, 'Suite', 400.00, TRUE, 4.8),
('Bali Beach Resort', 2, 'Double', 180.00, TRUE, 4.6),
('Ubud Jungle Lodge', 2, 'Single', 120.00, TRUE, 4.3),
('Tokyo Skyline Hotel', 3, 'Double', 220.00, TRUE, 4.4),
('Shinjuku Grand', 3, 'Suite', 350.00, TRUE, 4.7),
('Colosseum View Hotel', 4, 'Double', 200.00, TRUE, 4.5),
('Burj Al Arab', 5, 'Suite', 800.00, TRUE, 5.0),
('Desert Palm Dubai', 5, 'Double', 300.00, TRUE, 4.6),
('Santorini Cliffs Resort', 6, 'Suite', 500.00, TRUE, 4.9),
('Bangkok Palace Hotel', 7, 'Double', 150.00, TRUE, 4.2);

-- Flights
INSERT INTO Flights (airline_name, departure_location, departure_time, arrival_location, arrival_time, seat_availability, price) VALUES
('Middle East Airlines', 'Beirut, Lebanon', '2026-07-01 08:00:00', 'Paris, France', '2026-07-01 11:30:00', 'Economy', 450.00),
('Air France', 'Paris, France', '2026-07-08 14:00:00', 'Beirut, Lebanon', '2026-07-08 19:00:00', 'Economy', 430.00),
('Emirates', 'Beirut, Lebanon', '2026-08-15 06:00:00', 'Bali, Indonesia', '2026-08-15 22:00:00', 'Business', 900.00),
('Garuda Indonesia', 'Bali, Indonesia', '2026-08-22 10:00:00', 'Beirut, Lebanon', '2026-08-23 02:00:00', 'Economy', 850.00),
('Japan Airlines', 'Beirut, Lebanon', '2026-09-10 09:00:00', 'Tokyo, Japan', '2026-09-11 03:00:00', 'Economy', 700.00),
('ANA', 'Tokyo, Japan', '2026-09-17 15:00:00', 'Beirut, Lebanon', '2026-09-17 22:00:00', 'Economy', 680.00),
('Alitalia', 'Beirut, Lebanon', '2026-10-05 07:00:00', 'Rome, Italy', '2026-10-05 09:30:00', 'Economy', 320.00),
('Emirates', 'Beirut, Lebanon', '2026-11-01 10:00:00', 'Dubai, UAE', '2026-11-01 11:30:00', 'First Class', 280.00),
('Aegean Airlines', 'Beirut, Lebanon', '2026-06-20 08:00:00', 'Santorini, Greece', '2026-06-20 10:00:00', 'Economy', 350.00),
('Thai Airways', 'Beirut, Lebanon', '2026-12-01 05:00:00', 'Bangkok, Thailand', '2026-12-01 17:00:00', 'Economy', 600.00);

-- Tours
INSERT INTO Tours (tour_name, destination_id, duration, included_services, price) VALUES
('Eiffel Tower & Louvre Tour', 1, 1, 'Guided museum visit, skip-the-line tickets, lunch included', 120.00),
('Paris Night Cruise', 1, 1, 'Seine river cruise, dinner, live music', 90.00),
('Bali Temple & Rice Terrace Tour', 2, 1, 'Guided temple visits, rice terrace walk, traditional lunch', 75.00),
('Bali Snorkeling Adventure', 2, 1, 'Boat trip, snorkeling gear, tropical lunch', 85.00),
('Tokyo Street Food & Culture Walk', 3, 1, 'Food tasting in 5 neighborhoods, English guide', 65.00),
('Mt. Fuji Day Trip', 3, 1, 'Bus transport, entrance fees, bento lunch', 110.00),
('Rome Colosseum & Forum Tour', 4, 1, 'Skip-the-line entry, expert guide, 3 hour tour', 95.00),
('Vatican Museums Tour', 4, 1, 'Skip-the-line tickets, Sistine Chapel, audio guide', 85.00),
('Dubai Desert Safari', 5, 1, 'Dune bashing, camel ride, BBQ dinner, belly dancing', 130.00),
('Dubai City Tour', 5, 1, 'Burj Khalifa, Dubai Mall, old Dubai souks, guide included', 100.00),
('Santorini Sunset Sailing', 6, 1, 'Catamaran cruise, hot springs, BBQ dinner, sunset views', 150.00),
('Bangkok Temple & Food Tour', 7, 1, 'Wat Pho, Grand Palace, street food tasting, tuk-tuk ride', 70.00);

-- Travel Packages
INSERT INTO TravelPackages (package_name, destination_id, staff_id, total_price, travel_date, return_date, duration, description, status_availability, available_slots) VALUES
('Paris Adventure Package', 1, 5, 1500.00, '2026-07-01', '2026-07-08', 7, 'Explore the city of lights with guided tours, world-class museums, and fine dining experiences.', 'active', 10),
('Bali Relaxation Escape', 2, 5, 1200.00, '2026-08-15', '2026-08-22', 7, 'Unwind on pristine beaches with spa treatments, yoga sessions, and stunning sunsets.', 'active', 8),
('Tokyo Cultural Journey', 3, 6, 1800.00, '2026-09-10', '2026-09-17', 7, 'Immerse yourself in Japanese culture, ancient temples, futuristic technology and incredible street food.', 'active', 6),
('Rome Heritage Tour', 4, 5, 1350.00, '2026-10-05', '2026-10-12', 7, 'Walk through centuries of history in the eternal city, from the Colosseum to the Vatican.', 'active', 12),
('Dubai Luxury Experience', 5, 6, 2200.00, '2026-11-01', '2026-11-07', 6, 'Experience the pinnacle of luxury in Dubai with desert safaris, world-class shopping and iconic landmarks.', 'active', 5),
('Santorini Romantic Getaway', 6, 5, 1900.00, '2026-06-20', '2026-06-27', 7, 'A dreamy escape for couples with breathtaking caldera views, wine tasting, and sunset sailing.', 'active', 8),
('Bangkok Explorer', 7, 6, 1100.00, '2026-12-01', '2026-12-08', 7, 'Discover the vibrant energy of Bangkok with temple tours, floating markets, and authentic street food.', 'active', 15);

-- Package Hotels
INSERT INTO PackageHotels (package_id, hotel_id) VALUES
(1, 1), (1, 2),
(2, 3), (2, 4),
(3, 5), (3, 6),
(4, 7),
(5, 8), (5, 9),
(6, 10),
(7, 11);

-- Package Flights
INSERT INTO PackageFlights (package_id, flight_id) VALUES
(1, 1), (1, 2),
(2, 3), (2, 4),
(3, 5), (3, 6),
(4, 7),
(5, 8),
(6, 9),
(7, 10);

-- Package Tours
INSERT INTO PackageTours (package_id, tour_id) VALUES
(1, 1), (1, 2),
(2, 3), (2, 4),
(3, 5), (3, 6),
(4, 7), (4, 8),
(5, 9), (5, 10),
(6, 11),
(7, 12);

-- Package Moods
INSERT INTO PackageMoods (package_id, mood) VALUES
(1, 'Adventure'), (1, 'Cultural'),
(2, 'Relaxation'), (2, 'Romantic'),
(3, 'Cultural'), (3, 'Adventure'),
(4, 'Cultural'),
(5, 'Adventure'), (5, 'Relaxation'),
(6, 'Romantic'), (6, 'Relaxation'),
(7, 'Adventure'), (7, 'Cultural');

-- Add-ons per package
INSERT INTO AddOns (package_id, name, price) VALUES
(1, 'Travel Insurance', 50.00),
(1, 'Airport Transfer', 30.00),
(1, 'Extra Museum Pass', 45.00),
(1, 'French Cooking Class', 80.00),
(2, 'Spa Package', 90.00),
(2, 'Private Beach Cabana', 70.00),
(2, 'Surfing Lesson', 60.00),
(2, 'Travel Insurance', 50.00),
(3, 'Tea Ceremony Experience', 40.00),
(3, 'Sumo Wrestling Show Ticket', 55.00),
(3, 'Bullet Train Pass', 75.00),
(3, 'Travel Insurance', 50.00),
(4, 'Pasta Making Class', 65.00),
(4, 'Wine Tasting Tour', 80.00),
(4, 'Travel Insurance', 50.00),
(5, 'Private Desert Safari Upgrade', 150.00),
(5, 'Yacht Rental (2 hours)', 200.00),
(5, 'Travel Insurance', 50.00),
(6, 'Private Sunset Cruise', 180.00),
(6, 'Wine & Cheese Tasting', 75.00),
(6, 'Travel Insurance', 50.00),
(7, 'Thai Cooking Class', 55.00),
(7, 'Floating Market Tour', 45.00),
(7, 'Travel Insurance', 50.00);

-- Sample Bookings
INSERT INTO Bookings (booking_id, customer_id, package_id, staff_id, num_travelers, travel_date, status, total_price) VALUES
('BK-2026-0001', 1, 1, 5, 2, '2026-07-01', 'confirmed', 3000.00),
('BK-2026-0002', 2, 2, 5, 1, '2026-08-15', 'pending', 1200.00),
('BK-2026-0003', 3, 6, 5, 2, '2026-06-20', 'confirmed', 3800.00),
('BK-2026-0004', 4, 3, 6, 3, '2026-09-10', 'cancelled', 5400.00);

-- Sample Payments
INSERT INTO Payments (booking_id, transaction_id, amount, payment_method, payment_status) VALUES
('BK-2026-0001', 'TXN-20260701-001', 3000.00, 'Card', 'paid'),
('BK-2026-0003', 'TXN-20260620-001', 3800.00, 'Online', 'paid');

-- Sample Wishlists
INSERT INTO Wishlists (user_id, package_id) VALUES
(1, 3), (1, 5),
(2, 1), (2, 6),
(3, 2), (3, 7),
(4, 4), (4, 5);

-- Sample Notifications
INSERT INTO Notifications (user_id, message) VALUES
(1, 'Your booking BK-2026-0001 has been confirmed. Have a great trip to Paris!'),
(1, 'Your payment of $3000 for Paris Adventure Package was successful.'),
(2, 'Your booking BK-2026-0002 is pending agent approval.'),
(3, 'Your booking BK-2026-0003 to Santorini has been confirmed!'),
(5, 'New booking request BK-2026-0002 from Sara Ali is awaiting your approval.'),
(6, 'Booking BK-2026-0004 has been cancelled by the customer.');

-- Sample Messages
INSERT INTO Messages (booking_id, sender_id, content) VALUES
('BK-2026-0001', 1, 'Hello, I wanted to confirm that airport pickup is included in the package?'),
('BK-2026-0001', 5, 'Hi John! Yes, airport pickup is included. Your driver will meet you at arrivals. Enjoy Paris!'),
('BK-2026-0002', 2, 'Can I add the spa package as an add-on to my booking?'),
('BK-2026-0002', 5, 'Of course Sara! I will add the spa package to your booking right away.');

-- Sample Cancellation Request
INSERT INTO CancellationRequests (booking_id, user_id, reason, status) VALUES
('BK-2026-0004', 4, 'Change in travel plans due to personal reasons.', 'approved');

-- Sample Document
INSERT INTO Documents (customer_id, booking_id, document_type, file_path) VALUES
(1, 'BK-2026-0001', 'Invoice', '/documents/BK-2026-0001-invoice.pdf'),
(1, 'BK-2026-0001', 'Ticket', '/documents/BK-2026-0001-ticket.pdf'),
(3, 'BK-2026-0003', 'Invoice', '/documents/BK-2026-0003-invoice.pdf');