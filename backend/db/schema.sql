-- Drop and recreate for a clean run (dev only — never run this on production).
DROP DATABASE IF EXISTS polaris_db;
CREATE DATABASE polaris_db;
USE polaris_db;

-- Core user tables from report
CREATE TABLE Users (
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

CREATE TABLE Customers (
  customer_id INT PRIMARY KEY,
  passport_number VARCHAR(50),
  nationality VARCHAR(100),
  preferences TEXT,
  FOREIGN KEY (customer_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Staff (
  staff_id INT PRIMARY KEY,
  employment_type ENUM('Full-time', 'Part-time') DEFAULT 'Full-time',
  FOREIGN KEY (staff_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE PasswordHistory (
  history_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

-- Destinations, Hotels, Flights, Tours from report
CREATE TABLE Destinations (
  destination_id INT PRIMARY KEY AUTO_INCREMENT,
  country VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  description TEXT,
  climate_info VARCHAR(255)
);

CREATE TABLE Hotels (
  hotel_id INT PRIMARY KEY AUTO_INCREMENT,
  hotel_name VARCHAR(150) NOT NULL,
  destination_id INT NOT NULL,
  room_types ENUM('Single', 'Double', 'Suite'),
  price_per_night DECIMAL(10,2) NOT NULL,
  status_availability BOOLEAN DEFAULT TRUE,
  rating DECIMAL(2,1),
  FOREIGN KEY (destination_id) REFERENCES Destinations(destination_id)
);

CREATE TABLE Flights (
  flight_id INT PRIMARY KEY AUTO_INCREMENT,
  airline_name VARCHAR(100) NOT NULL,
  departure_location VARCHAR(150) NOT NULL,
  departure_time DATETIME NOT NULL,
  arrival_location VARCHAR(150) NOT NULL,
  arrival_time DATETIME NOT NULL,
  seat_availability ENUM('Economy', 'Business', 'First Class'),
  price DECIMAL(10,2) NOT NULL
);

CREATE TABLE Tours (
  tour_id INT PRIMARY KEY AUTO_INCREMENT,
  tour_name VARCHAR(150) NOT NULL,
  destination_id INT NOT NULL,
  duration INT NOT NULL,
  included_services TEXT,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (destination_id) REFERENCES Destinations(destination_id)
);

-- Travel Packages from report
CREATE TABLE TravelPackages (
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

-- Junction tables for M:N relationships from report
CREATE TABLE PackageHotels (
  package_id INT,
  hotel_id INT,
  PRIMARY KEY (package_id, hotel_id),
  FOREIGN KEY (package_id) REFERENCES TravelPackages(package_id) ON DELETE CASCADE,
  FOREIGN KEY (hotel_id) REFERENCES Hotels(hotel_id)
);

CREATE TABLE PackageFlights (
  package_id INT,
  flight_id INT,
  PRIMARY KEY (package_id, flight_id),
  FOREIGN KEY (package_id) REFERENCES TravelPackages(package_id) ON DELETE CASCADE,
  FOREIGN KEY (flight_id) REFERENCES Flights(flight_id)
);

CREATE TABLE PackageTours (
  package_id INT,
  tour_id INT,
  PRIMARY KEY (package_id, tour_id),
  FOREIGN KEY (package_id) REFERENCES TravelPackages(package_id) ON DELETE CASCADE,
  FOREIGN KEY (tour_id) REFERENCES Tours(tour_id)
);

-- Bookings and Payments from report
CREATE TABLE Bookings (
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

CREATE TABLE Payments (
  payment_id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id VARCHAR(20) NOT NULL,
  transaction_id VARCHAR(50) UNIQUE,
  payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('Card', 'Cash', 'Online') DEFAULT 'Card',
  payment_status ENUM('paid', 'pending', 'failed') DEFAULT 'pending',
  FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id)
);

CREATE TABLE Documents (
  document_id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  booking_id VARCHAR(20),
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  document_type ENUM('Ticket', 'Visa', 'Invoice', 'Insurance') NOT NULL,
  file_path VARCHAR(255),
  FOREIGN KEY (customer_id) REFERENCES Users(user_id),
  FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id)
);

-- Extra tables needed for functional requirements (not in appendix but required by features)
CREATE TABLE PackageMoods (
  mood_id INT PRIMARY KEY AUTO_INCREMENT,
  package_id INT NOT NULL,
  mood ENUM('Adventure', 'Relaxation', 'Cultural', 'Family', 'Romantic') NOT NULL,
  FOREIGN KEY (package_id) REFERENCES TravelPackages(package_id) ON DELETE CASCADE
);

CREATE TABLE AddOns (
  addon_id INT PRIMARY KEY AUTO_INCREMENT,
  package_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (package_id) REFERENCES TravelPackages(package_id) ON DELETE CASCADE
);

CREATE TABLE BookingAddOns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id VARCHAR(20) NOT NULL,
  addon_id INT NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id) ON DELETE CASCADE,
  FOREIGN KEY (addon_id) REFERENCES AddOns(addon_id)
);

CREATE TABLE Wishlists (
  wishlist_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  package_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (package_id) REFERENCES TravelPackages(package_id) ON DELETE CASCADE
);

CREATE TABLE Notifications (
  notification_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE CancellationRequests (
  cancel_id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id VARCHAR(20) NOT NULL,
  user_id INT NOT NULL,
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id),
  FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE PackageUpdateRequests (
  update_id INT PRIMARY KEY AUTO_INCREMENT,
  package_id INT NOT NULL,
  agent_id INT NOT NULL,
  updated_data JSON NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (package_id) REFERENCES TravelPackages(package_id),
  FOREIGN KEY (agent_id) REFERENCES Users(user_id)
);

CREATE TABLE Messages (
  message_id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id VARCHAR(20) NOT NULL,
  sender_id INT NOT NULL,
  content TEXT NOT NULL,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES Bookings(booking_id),
  FOREIGN KEY (sender_id) REFERENCES Users(user_id)
);

-- Indexes
CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_users_role ON Users(role);
CREATE INDEX idx_packages_destination ON TravelPackages(destination_id);
CREATE INDEX idx_packages_status ON TravelPackages(status_availability);
CREATE INDEX idx_bookings_customer ON Bookings(customer_id);
CREATE INDEX idx_bookings_status ON Bookings(status);
CREATE INDEX idx_notifications_user ON Notifications(user_id);
CREATE INDEX idx_payments_status ON Payments(payment_status);
CREATE INDEX idx_packages_price ON TravelPackages(total_price);
CREATE INDEX idx_moods_mood ON PackageMoods(mood);