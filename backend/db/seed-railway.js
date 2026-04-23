const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
    multipleStatements: true,
  });

  console.log(`Connected to ${process.env.DB_NAME} on ${process.env.DB_HOST}`);

  const schema = `
CREATE TABLE IF NOT EXISTS Users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  gender ENUM('Male', 'Female', 'Other'),
  date_of_birth DATE,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('Customer', 'TravelAgent', 'Administrator') DEFAULT 'Customer',
  status ENUM('Active', 'Suspended', 'Deleted') DEFAULT 'Active',
  last_login_at DATETIME,
  is_locked BOOLEAN DEFAULT FALSE,
  failed_attempts INT DEFAULT 0,
  lock_until DATETIME DEFAULT NULL,
  password_changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  otp_code VARCHAR(6) DEFAULT NULL,
  otp_expires_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Customers (
  customer_id INT PRIMARY KEY,
  passport_number VARCHAR(50),
  nationality VARCHAR(100),
  preferences TEXT,
  FOREIGN KEY (customer_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Staff (
  staff_id INT PRIMARY KEY,
  employment_type ENUM('Full-time', 'Part-time') DEFAULT 'Full-time',
  FOREIGN KEY (staff_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS PasswordHistory (
  history_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Destinations (
  destination_id INT PRIMARY KEY AUTO_INCREMENT,
  country VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  description TEXT,
  climate_info VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS Hotels (
  hotel_id INT PRIMARY KEY AUTO_INCREMENT,
  hotel_name VARCHAR(150) NOT NULL,
  destination_id INT NOT NULL,
  room_types ENUM('Single', 'Double', 'Suite'),
  price_per_night DECIMAL(10,2) NOT NULL,
  status_availability BOOLEAN DEFAULT TRUE,
  rating DECIMAL(2,1),
  FOREIGN KEY (destination_id) REFERENCES Destinations(destination_id)
);

CREATE TABLE IF NOT EXISTS Flights (
  flight_id INT PRIMARY KEY AUTO_INCREMENT,
  airline_name VARCHAR(100) NOT NULL,
  departure_location VARCHAR(150) NOT NULL,
  departure_time DATETIME NOT NULL,
  arrival_location VARCHAR(150) NOT NULL,
  arrival_time DATETIME NOT NULL,
  seat_availability ENUM('Economy', 'Business', 'First Class'),
  price DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS Tours (
  tour_id INT PRIMARY KEY AUTO_INCREMENT,
  tour_name VARCHAR(150) NOT NULL,
  destination_id INT NOT NULL,
  duration INT NOT NULL,
  included_services TEXT,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (destination_id) REFERENCES Destinations(destination_id)
);

CREATE TABLE IF NOT EXISTS TravelPackages (
  package_id INT PRIMARY KEY AUTO_INCREMENT,
  package_name VARCHAR(150) NOT NULL,
  destination_id INT NOT NULL,
  staff_id INT NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  travel_date DATE NOT NULL,
  return_date DATE NOT NULL,
  duration INT NOT NULL,
  description TEXT,
  status_availability ENUM('active', 'pending_approval', 'inactive') DEFAULT 'active',
  available_slots INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (destination_id) REFERENCES Destinations(destination_id),
  FOREIGN KEY (staff_id) REFERENCES Users(user_id)
);

CREATE TABLE IF NOT EXISTS PackageHotels (
  package_id INT,
  hotel_id INT,
  PRIMARY KEY (package_id, hotel_id),
  FOREIGN KEY (package_id) REFERENCES TravelPackages(package_id) ON DELETE CASCADE,
  FOREIGN KEY (hotel_id) REFERENCES Hotels(hotel_id)
);

CREATE TABLE IF NOT EXISTS PackageFlights (
  package_id INT,
  flight_id INT,
  PRIMARY KEY (package_id, flight_id),
  FOREIGN KEY (package_id) REFERENCES TravelPackages(package_id) ON DELETE CASCADE,
  FOREIGN KEY (flight_id) REFERENCES Flights(flight_id)
);

CREATE TABLE IF NOT EXISTS PackageTours (
  package_id INT,
  tour_id INT,
  PRIMARY KEY (package_id, tour_id),
  FOREIGN KEY (package_id) REFERENCES TravelPackages(package_id) ON DELETE CASCADE,
  FOREIGN KEY (tour_id) REFERENCES Tours(tour_id)
);

CREATE TABLE IF NOT EXISTS Bookings (
  booking_id VARCHAR(20) PRIMARY KEY,
  customer_id INT NOT NULL,
  package_id INT NOT NULL,
  staff_id INT,
  num_travelers INT NOT NULL DEFAULT 1,
  booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  travel_date DATE NOT NULL,
  status ENUM('pending', 'confirmed', 'cancelled', 'modified') DEFAULT 'pending',
  total_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES Users(user_id),
  FOREIGN KEY (package_id) REFERENCES TravelPackages(package_id),
  FOREIGN KEY (staff_id) REFERENCES Users(user_id)
);

CREATE TABLE IF NOT EXISTS Payments (
  payment_id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id VARCHAR(20) NOT NULL,
  transaction_id VARCHAR(50) UNIQUE,
  payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('Card', 'Cash', 'Online') DEFAULT 'Card',
  payment_status ENUM('paid', 'pending', 'failed') DEFAULT 'pending',
  FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id)
);

CREATE TABLE IF NOT EXISTS Documents (
  document_id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  booking_id VARCHAR(20),
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  document_type ENUM('Ticket', 'Visa', 'Invoice', 'Insurance') NOT NULL,
  file_path VARCHAR(255),
  FOREIGN KEY (customer_id) REFERENCES Users(user_id),
  FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id)
);

CREATE TABLE IF NOT EXISTS PackageMoods (
  mood_id INT PRIMARY KEY AUTO_INCREMENT,
  package_id INT NOT NULL,
  mood ENUM('Adventure', 'Relaxation', 'Cultural', 'Family', 'Romantic') NOT NULL,
  FOREIGN KEY (package_id) REFERENCES TravelPackages(package_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS AddOns (
  addon_id INT PRIMARY KEY AUTO_INCREMENT,
  package_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (package_id) REFERENCES TravelPackages(package_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS BookingAddOns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id VARCHAR(20) NOT NULL,
  addon_id INT NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id) ON DELETE CASCADE,
  FOREIGN KEY (addon_id) REFERENCES AddOns(addon_id)
);

CREATE TABLE IF NOT EXISTS Wishlists (
  wishlist_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  package_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (package_id) REFERENCES TravelPackages(package_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Notifications (
  notification_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS CancellationRequests (
  cancel_id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id VARCHAR(20) NOT NULL,
  user_id INT NOT NULL,
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id),
  FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE IF NOT EXISTS PackageUpdateRequests (
  update_id INT PRIMARY KEY AUTO_INCREMENT,
  package_id INT NOT NULL,
  agent_id INT NOT NULL,
  updated_data JSON NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (package_id) REFERENCES TravelPackages(package_id),
  FOREIGN KEY (agent_id) REFERENCES Users(user_id)
);

CREATE TABLE IF NOT EXISTS Messages (
  message_id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id VARCHAR(20) NOT NULL,
  sender_id INT NOT NULL,
  content TEXT NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id),
  FOREIGN KEY (sender_id) REFERENCES Users(user_id)
);
`;

  console.log('Creating tables (if not exist)...');
  await conn.query(schema);
  console.log('Tables ready.');

  // password for all = Test@1234
  const passwordHash = '$2b$10$ybA7MTb/lSl1Br1XupD3i.XothQT8HmVv/05barxx/1lesOOwp7ei';

  console.log('Seeding users...');
  const users = [
    ['john_doe',     'John Doe',     'Male',   '1995-03-15', 'customer1@test.com', '+96170000001', 'Beirut, Lebanon',  'Customer',      'Active'],
    ['sara_ali',     'Sara Ali',     'Female', '1998-07-22', 'customer2@test.com', '+96170000002', 'Tripoli, Lebanon', 'Customer',      'Active'],
    ['maya_kh',      'Maya Khalil',  'Female', '2000-01-10', 'customer3@test.com', '+96170000003', 'Sidon, Lebanon',   'Customer',      'Active'],
    ['omar_hassan',  'Omar Hassan',  'Male',   '1993-11-05', 'customer4@test.com', '+96170000004', 'Jounieh, Lebanon', 'Customer',      'Active'],
    ['agent_sara',   'Sara Mansour', 'Female', '1990-05-18', 'agent1@test.com',    '+96170000005', 'Beirut, Lebanon',  'TravelAgent',   'Active'],
    ['agent_karim',  'Karim Nassar', 'Male',   '1988-09-30', 'agent2@test.com',    '+96170000006', 'Beirut, Lebanon',  'TravelAgent',   'Active'],
    ['admin_lara',   'Lara Haddad',  'Female', '1985-04-12', 'admin@test.com',     '+96170000007', 'Beirut, Lebanon',  'Administrator', 'Active'],
  ];

  for (const [username, full_name, gender, dob, email, phone, address, role, status] of users) {
    await conn.query(
      `INSERT IGNORE INTO Users (username, full_name, gender, date_of_birth, email, phone, address, password_hash, role, status, password_changed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [username, full_name, gender, dob, email, phone, address, passwordHash, role, status]
    );
  }
  console.log('Users seeded.');

  // Look up the user_ids that were just inserted (order may vary if some already existed)
  const [rows] = await conn.query('SELECT user_id, email FROM Users WHERE email IN (?) ORDER BY user_id',
    [users.map(u => u[4])]);
  const byEmail = Object.fromEntries(rows.map(r => [r.email, r.user_id]));

  console.log('Seeding Customers...');
  const customerData = [
    [byEmail['customer1@test.com'], 'LB123456', 'Lebanese', 'Beach, Adventure'],
    [byEmail['customer2@test.com'], 'LB234567', 'Lebanese', 'Cultural, City tours'],
    [byEmail['customer3@test.com'], 'LB345678', 'Lebanese', 'Relaxation, Spa'],
    [byEmail['customer4@test.com'], 'LB456789', 'Lebanese', 'Family, Nature'],
  ];
  for (const [id, passport, nationality, prefs] of customerData) {
    await conn.query('INSERT IGNORE INTO Customers (customer_id, passport_number, nationality, preferences) VALUES (?, ?, ?, ?)',
      [id, passport, nationality, prefs]);
  }

  console.log('Seeding Staff...');
  await conn.query('INSERT IGNORE INTO Staff (staff_id, employment_type) VALUES (?, ?)', [byEmail['agent1@test.com'], 'Full-time']);
  await conn.query('INSERT IGNORE INTO Staff (staff_id, employment_type) VALUES (?, ?)', [byEmail['agent2@test.com'], 'Full-time']);

  console.log('Seeding Destinations...');
  const destinations = [
    ['France',    'Paris',     'The city of lights, known for art, fashion, and culture.',           'Temperate, mild summers and cool winters'],
    ['Indonesia', 'Bali',      'A tropical paradise with stunning beaches and rice terraces.',         'Tropical, warm all year round'],
    ['Japan',     'Tokyo',     'A vibrant metropolis blending tradition and modernity.',               'Humid subtropical, four distinct seasons'],
    ['Italy',     'Rome',      'The eternal city full of ancient history and delicious food.',         'Mediterranean, hot dry summers'],
    ['UAE',       'Dubai',     'A futuristic city known for luxury, shopping, and desert experiences.','Hot desert climate, sunny year round'],
    ['Greece',    'Santorini', 'Iconic white-washed buildings and breathtaking volcanic views.',       'Mediterranean, warm and sunny'],
    ['Thailand',  'Bangkok',   'A lively city with ornate temples, street food, and nightlife.',       'Tropical, hot and humid'],
  ];
  for (const [country, city, desc, climate] of destinations) {
    await conn.query('INSERT IGNORE INTO Destinations (country, city, description, climate_info) VALUES (?, ?, ?, ?)',
      [country, city, desc, climate]);
  }

  const [[{ 'COUNT(*)': destCount }]] = await conn.query('SELECT COUNT(*) FROM Destinations');
  const [destRows] = await conn.query('SELECT destination_id, city FROM Destinations ORDER BY destination_id LIMIT 7');
  const destByCity = Object.fromEntries(destRows.map(r => [r.city, r.destination_id]));

  console.log('Seeding Hotels...');
  const hotels = [
    ['Le Grand Paris',         destByCity['Paris'],     'Double', 250.00, true, 4.5],
    ['Eiffel Boutique Hotel',  destByCity['Paris'],     'Suite',  400.00, true, 4.8],
    ['Bali Beach Resort',      destByCity['Bali'],      'Double', 180.00, true, 4.6],
    ['Ubud Jungle Lodge',      destByCity['Bali'],      'Single', 120.00, true, 4.3],
    ['Tokyo Skyline Hotel',    destByCity['Tokyo'],     'Double', 220.00, true, 4.4],
    ['Shinjuku Grand',         destByCity['Tokyo'],     'Suite',  350.00, true, 4.7],
    ['Colosseum View Hotel',   destByCity['Rome'],      'Double', 200.00, true, 4.5],
    ['Burj Al Arab',           destByCity['Dubai'],     'Suite',  800.00, true, 5.0],
    ['Desert Palm Dubai',      destByCity['Dubai'],     'Double', 300.00, true, 4.6],
    ['Santorini Cliffs Resort',destByCity['Santorini'],'Suite',  500.00, true, 4.9],
    ['Bangkok Palace Hotel',   destByCity['Bangkok'],   'Double', 150.00, true, 4.2],
  ];
  for (const [name, destId, type, price, avail, rating] of hotels) {
    await conn.query('INSERT IGNORE INTO Hotels (hotel_name, destination_id, room_types, price_per_night, status_availability, rating) VALUES (?, ?, ?, ?, ?, ?)',
      [name, destId, type, price, avail, rating]);
  }

  console.log('Seeding Flights...');
  const flights = [
    ['Middle East Airlines', 'Beirut, Lebanon',    '2026-07-01 08:00:00', 'Paris, France',      '2026-07-01 11:30:00', 'Economy',    450.00],
    ['Air France',           'Paris, France',      '2026-07-08 14:00:00', 'Beirut, Lebanon',    '2026-07-08 19:00:00', 'Economy',    430.00],
    ['Emirates',             'Beirut, Lebanon',    '2026-08-15 06:00:00', 'Bali, Indonesia',    '2026-08-15 22:00:00', 'Business',   900.00],
    ['Garuda Indonesia',     'Bali, Indonesia',    '2026-08-22 10:00:00', 'Beirut, Lebanon',    '2026-08-23 02:00:00', 'Economy',    850.00],
    ['Japan Airlines',       'Beirut, Lebanon',    '2026-09-10 09:00:00', 'Tokyo, Japan',       '2026-09-11 03:00:00', 'Economy',    700.00],
    ['ANA',                  'Tokyo, Japan',       '2026-09-17 15:00:00', 'Beirut, Lebanon',    '2026-09-17 22:00:00', 'Economy',    680.00],
    ['Alitalia',             'Beirut, Lebanon',    '2026-10-05 07:00:00', 'Rome, Italy',        '2026-10-05 09:30:00', 'Economy',    320.00],
    ['Emirates',             'Beirut, Lebanon',    '2026-11-01 10:00:00', 'Dubai, UAE',         '2026-11-01 11:30:00', 'First Class',280.00],
    ['Aegean Airlines',      'Beirut, Lebanon',    '2026-06-20 08:00:00', 'Santorini, Greece',  '2026-06-20 10:00:00', 'Economy',    350.00],
    ['Thai Airways',         'Beirut, Lebanon',    '2026-12-01 05:00:00', 'Bangkok, Thailand',  '2026-12-01 17:00:00', 'Economy',    600.00],
  ];
  for (const [airline, dep, depTime, arr, arrTime, seat, price] of flights) {
    await conn.query('INSERT IGNORE INTO Flights (airline_name, departure_location, departure_time, arrival_location, arrival_time, seat_availability, price) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [airline, dep, depTime, arr, arrTime, seat, price]);
  }

  console.log('Seeding Tours...');
  const tours = [
    ['Eiffel Tower & Louvre Tour',        destByCity['Paris'],     1, 'Guided museum visit, skip-the-line tickets, lunch included',      120.00],
    ['Paris Night Cruise',                destByCity['Paris'],     1, 'Seine river cruise, dinner, live music',                           90.00],
    ['Bali Temple & Rice Terrace Tour',   destByCity['Bali'],      1, 'Guided temple visits, rice terrace walk, traditional lunch',        75.00],
    ['Bali Snorkeling Adventure',         destByCity['Bali'],      1, 'Boat trip, snorkeling gear, tropical lunch',                        85.00],
    ['Tokyo Street Food & Culture Walk',  destByCity['Tokyo'],     1, 'Food tasting in 5 neighborhoods, English guide',                    65.00],
    ['Mt. Fuji Day Trip',                 destByCity['Tokyo'],     1, 'Bus transport, entrance fees, bento lunch',                        110.00],
    ['Rome Colosseum & Forum Tour',       destByCity['Rome'],      1, 'Skip-the-line entry, expert guide, 3 hour tour',                    95.00],
    ['Vatican Museums Tour',              destByCity['Rome'],      1, 'Skip-the-line tickets, Sistine Chapel, audio guide',                85.00],
    ['Dubai Desert Safari',               destByCity['Dubai'],     1, 'Dune bashing, camel ride, BBQ dinner, belly dancing',              130.00],
    ['Dubai City Tour',                   destByCity['Dubai'],     1, 'Burj Khalifa, Dubai Mall, old Dubai souks, guide included',        100.00],
    ['Santorini Sunset Sailing',          destByCity['Santorini'],1, 'Catamaran cruise, hot springs, BBQ dinner, sunset views',          150.00],
    ['Bangkok Temple & Food Tour',        destByCity['Bangkok'],   1, 'Wat Pho, Grand Palace, street food tasting, tuk-tuk ride',          70.00],
  ];
  for (const [name, destId, dur, services, price] of tours) {
    await conn.query('INSERT IGNORE INTO Tours (tour_name, destination_id, duration, included_services, price) VALUES (?, ?, ?, ?, ?)',
      [name, destId, dur, services, price]);
  }

  console.log('Seeding TravelPackages...');
  const agent1Id = byEmail['agent1@test.com'];
  const agent2Id = byEmail['agent2@test.com'];
  const packages = [
    ['Paris Adventure Package',     destByCity['Paris'],     agent1Id, 1500.00, '2026-07-01', '2026-07-08', 7, 'Explore the city of lights with guided tours, world-class museums, and fine dining experiences.',                                    'active', 10],
    ['Bali Relaxation Escape',      destByCity['Bali'],      agent1Id, 1200.00, '2026-08-15', '2026-08-22', 7, 'Unwind on pristine beaches with spa treatments, yoga sessions, and stunning sunsets.',                                              'active', 8],
    ['Tokyo Cultural Journey',      destByCity['Tokyo'],     agent2Id, 1800.00, '2026-09-10', '2026-09-17', 7, 'Immerse yourself in Japanese culture, ancient temples, futuristic technology and incredible street food.',                           'active', 6],
    ['Rome Heritage Tour',          destByCity['Rome'],      agent1Id, 1350.00, '2026-10-05', '2026-10-12', 7, 'Walk through centuries of history in the eternal city, from the Colosseum to the Vatican.',                                         'active', 12],
    ['Dubai Luxury Experience',     destByCity['Dubai'],     agent2Id, 2200.00, '2026-11-01', '2026-11-07', 6, 'Experience the pinnacle of luxury in Dubai with desert safaris, world-class shopping and iconic landmarks.',                         'active', 5],
    ['Santorini Romantic Getaway',  destByCity['Santorini'],agent1Id, 1900.00, '2026-06-20', '2026-06-27', 7, 'A dreamy escape for couples with breathtaking caldera views, wine tasting, and sunset sailing.',                                    'active', 8],
    ['Bangkok Explorer',            destByCity['Bangkok'],   agent2Id, 1100.00, '2026-12-01', '2026-12-08', 7, 'Discover the vibrant energy of Bangkok with temple tours, floating markets, and authentic street food.',                            'active', 15],
  ];
  for (const [name, destId, staffId, price, travel, ret, dur, desc, status, slots] of packages) {
    await conn.query(
      `INSERT IGNORE INTO TravelPackages (package_name, destination_id, staff_id, total_price, travel_date, return_date, duration, description, status_availability, available_slots)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, destId, staffId, price, travel, ret, dur, desc, status, slots]
    );
  }

  const [pkgRows] = await conn.query('SELECT package_id, package_name FROM TravelPackages ORDER BY package_id LIMIT 7');
  const [hotelRows] = await conn.query('SELECT hotel_id FROM Hotels ORDER BY hotel_id LIMIT 11');
  const [flightRows] = await conn.query('SELECT flight_id FROM Flights ORDER BY flight_id LIMIT 10');
  const [tourRows] = await conn.query('SELECT tour_id FROM Tours ORDER BY tour_id LIMIT 12');
  const p = pkgRows.map(r => r.package_id);
  const h = hotelRows.map(r => r.hotel_id);
  const f = flightRows.map(r => r.flight_id);
  const t = tourRows.map(r => r.tour_id);

  console.log('Seeding junction tables...');
  const pkgHotels = [[p[0],h[0]],[p[0],h[1]],[p[1],h[2]],[p[1],h[3]],[p[2],h[4]],[p[2],h[5]],[p[3],h[6]],[p[4],h[7]],[p[4],h[8]],[p[5],h[9]],[p[6],h[10]]];
  for (const [pid, hid] of pkgHotels) await conn.query('INSERT IGNORE INTO PackageHotels VALUES (?, ?)', [pid, hid]);

  const pkgFlights = [[p[0],f[0]],[p[0],f[1]],[p[1],f[2]],[p[1],f[3]],[p[2],f[4]],[p[2],f[5]],[p[3],f[6]],[p[4],f[7]],[p[5],f[8]],[p[6],f[9]]];
  for (const [pid, fid] of pkgFlights) await conn.query('INSERT IGNORE INTO PackageFlights VALUES (?, ?)', [pid, fid]);

  const pkgTours = [[p[0],t[0]],[p[0],t[1]],[p[1],t[2]],[p[1],t[3]],[p[2],t[4]],[p[2],t[5]],[p[3],t[6]],[p[3],t[7]],[p[4],t[8]],[p[4],t[9]],[p[5],t[10]],[p[6],t[11]]];
  for (const [pid, tid] of pkgTours) await conn.query('INSERT IGNORE INTO PackageTours VALUES (?, ?)', [pid, tid]);

  console.log('Seeding PackageMoods...');
  const moods = [
    [p[0],'Adventure'],[p[0],'Cultural'],
    [p[1],'Relaxation'],[p[1],'Romantic'],
    [p[2],'Cultural'],[p[2],'Adventure'],
    [p[3],'Cultural'],
    [p[4],'Adventure'],[p[4],'Relaxation'],
    [p[5],'Romantic'],[p[5],'Relaxation'],
    [p[6],'Adventure'],[p[6],'Cultural'],
  ];
  for (const [pid, mood] of moods) await conn.query('INSERT IGNORE INTO PackageMoods (package_id, mood) VALUES (?, ?)', [pid, mood]);

  console.log('Seeding AddOns...');
  const addons = [
    [p[0],'Travel Insurance',50],[p[0],'Airport Transfer',30],[p[0],'Extra Museum Pass',45],[p[0],'French Cooking Class',80],
    [p[1],'Spa Package',90],[p[1],'Private Beach Cabana',70],[p[1],'Surfing Lesson',60],[p[1],'Travel Insurance',50],
    [p[2],'Tea Ceremony Experience',40],[p[2],'Sumo Wrestling Show Ticket',55],[p[2],'Bullet Train Pass',75],[p[2],'Travel Insurance',50],
    [p[3],'Pasta Making Class',65],[p[3],'Wine Tasting Tour',80],[p[3],'Travel Insurance',50],
    [p[4],'Private Desert Safari Upgrade',150],[p[4],'Yacht Rental (2 hours)',200],[p[4],'Travel Insurance',50],
    [p[5],'Private Sunset Cruise',180],[p[5],'Wine & Cheese Tasting',75],[p[5],'Travel Insurance',50],
    [p[6],'Thai Cooking Class',55],[p[6],'Floating Market Tour',45],[p[6],'Travel Insurance',50],
  ];
  for (const [pid, name, price] of addons) await conn.query('INSERT IGNORE INTO AddOns (package_id, name, price) VALUES (?, ?, ?)', [pid, name, price]);

  console.log('Seeding Bookings...');
  const c1 = byEmail['customer1@test.com'], c2 = byEmail['customer2@test.com'];
  const c3 = byEmail['customer3@test.com'], c4 = byEmail['customer4@test.com'];
  const s1 = byEmail['agent1@test.com'],    s2 = byEmail['agent2@test.com'];
  const bookings = [
    ['BK-2026-0001', c1, p[0], s1, 2, '2026-07-01', 'confirmed', 3000.00],
    ['BK-2026-0002', c2, p[1], s1, 1, '2026-08-15', 'pending',   1200.00],
    ['BK-2026-0003', c3, p[5], s1, 2, '2026-06-20', 'confirmed', 3800.00],
    ['BK-2026-0004', c4, p[2], s2, 3, '2026-09-10', 'cancelled', 5400.00],
  ];
  for (const [bid, cid, pid, sid, num, tdate, status, total] of bookings) {
    await conn.query(
      'INSERT IGNORE INTO Bookings (booking_id, customer_id, package_id, staff_id, num_travelers, travel_date, status, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [bid, cid, pid, sid, num, tdate, status, total]
    );
  }

  console.log('Seeding Payments, Wishlists, Notifications, Messages, CancellationRequests, Documents...');
  await conn.query("INSERT IGNORE INTO Payments (booking_id, transaction_id, amount, payment_method, payment_status) VALUES ('BK-2026-0001','TXN-20260701-001',3000.00,'Card','paid'),('BK-2026-0003','TXN-20260620-001',3800.00,'Online','paid')");

  const wishlists = [[c1,p[2]],[c1,p[4]],[c2,p[0]],[c2,p[5]],[c3,p[1]],[c3,p[6]],[c4,p[3]],[c4,p[4]]];
  for (const [uid, pid] of wishlists) await conn.query('INSERT IGNORE INTO Wishlists (user_id, package_id) VALUES (?, ?)', [uid, pid]);

  const notifications = [
    [c1,'Your booking BK-2026-0001 has been confirmed. Have a great trip to Paris!'],
    [c1,'Your payment of $3000 for Paris Adventure Package was successful.'],
    [c2,'Your booking BK-2026-0002 is pending agent approval.'],
    [c3,'Your booking BK-2026-0003 to Santorini has been confirmed!'],
    [s1,'New booking request BK-2026-0002 from Sara Ali is awaiting your approval.'],
    [s2,'Booking BK-2026-0004 has been cancelled by the customer.'],
  ];
  for (const [uid, msg] of notifications) await conn.query('INSERT INTO Notifications (user_id, message) VALUES (?, ?)', [uid, msg]);

  const messages = [
    ['BK-2026-0001', c1, 'Hello, I wanted to confirm that airport pickup is included in the package?'],
    ['BK-2026-0001', s1, 'Hi John! Yes, airport pickup is included. Your driver will meet you at arrivals. Enjoy Paris!'],
    ['BK-2026-0002', c2, 'Can I add the spa package as an add-on to my booking?'],
    ['BK-2026-0002', s1, 'Of course Sara! I will add the spa package to your booking right away.'],
  ];
  for (const [bid, sid, content] of messages) await conn.query('INSERT IGNORE INTO Messages (booking_id, sender_id, content) VALUES (?, ?, ?)', [bid, sid, content]);

  await conn.query("INSERT IGNORE INTO CancellationRequests (booking_id, user_id, reason, status) VALUES ('BK-2026-0004', ?, 'Change in travel plans due to personal reasons.', 'approved')", [c4]);

  const docs = [[c1,'BK-2026-0001','Invoice','/documents/BK-2026-0001-invoice.pdf'],[c1,'BK-2026-0001','Ticket','/documents/BK-2026-0001-ticket.pdf'],[c3,'BK-2026-0003','Invoice','/documents/BK-2026-0003-invoice.pdf']];
  for (const [cid, bid, dtype, fpath] of docs) await conn.query('INSERT IGNORE INTO Documents (customer_id, booking_id, document_type, file_path) VALUES (?, ?, ?, ?)', [cid, bid, dtype, fpath]);

  await conn.end();
  console.log('\nDone! Seed data loaded into Railway database.');
  console.log('Login credentials (all use password: Test@1234):');
  console.log('  admin@test.com    → Administrator');
  console.log('  agent1@test.com   → TravelAgent');
  console.log('  agent2@test.com   → TravelAgent');
  console.log('  customer1@test.com → Customer');
}

run().catch(err => { console.error(err); process.exit(1); });
