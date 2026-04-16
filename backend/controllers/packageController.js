// controllers/packageController.js

const db = require('../db/connection'); 
async function getMoods(packageId) {
  const [rows] = await db.query(
    'SELECT mood FROM PackageMoods WHERE package_id = ?',
    [packageId]
  );
  return rows.map((r) => r.mood);
}

const getAllPackages = async (req, res) => {
  try {
    const { destination, minPrice, maxPrice, mood, date } = req.query;

    let query = `
      SELECT DISTINCT
        tp.package_id,
        tp.package_name,
        d.city,
        d.country,
        tp.travel_date,
        tp.return_date,
        tp.duration,
        tp.total_price,
        tp.available_slots,
        tp.status_availability
      FROM TravelPackages tp
      JOIN Destinations d ON tp.destination_id = d.destination_id
      LEFT JOIN PackageMoods pm ON tp.package_id = pm.package_id
      WHERE tp.status_availability = 'active'
    `;

    const params = [];

    if (destination) {
      query += ' AND (d.city LIKE ? OR d.country LIKE ?)';
      params.push(`%${destination}%`, `%${destination}%`);
    }

    if (minPrice) {
      query += ' AND tp.total_price >= ?';
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      query += ' AND tp.total_price <= ?';
      params.push(Number(maxPrice));
    }

    if (mood) {
      query += ' AND pm.mood = ?';
      params.push(mood);
    }

    if (date) {
      query += ' AND tp.travel_date = ?';
      params.push(date);
    }

    const [packages] = await db.query(query, params);

    // Attach moods array to each package
    const result = await Promise.all(
      packages.map(async (pkg) => ({
        package_id: pkg.package_id,
        package_name: pkg.package_name,
        destination: { city: pkg.city, country: pkg.country },
        travel_date: pkg.travel_date,
        return_date: pkg.return_date,
        duration: pkg.duration,
        total_price: pkg.total_price,
        available_slots: pkg.available_slots,
        status_availability: pkg.status_availability,
        moods: await getMoods(pkg.package_id),
      }))
    );

    return res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    console.error('getAllPackages error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// ROUTE 2 — GET /api/packages/:id
// Returns full package details
// ─────────────────────────────────────────────
// ROUTE 2 — GET /api/packages/:id
// Returns full package details
// ─────────────────────────────────────────────
const getOnePackage = async (req, res) => {
  try {
    const { id } = req.params;

    // Main package + destination
    const [pkgRows] = await db.query(
      `SELECT
        tp.package_id,
        tp.package_name,
        tp.description,
        d.city,
        d.country,
        d.description AS destination_description,
        d.climate_info,
        tp.travel_date,
        tp.return_date,
        tp.duration,
        tp.total_price,
        tp.available_slots,
        tp.status_availability
      FROM TravelPackages tp
      JOIN Destinations d ON tp.destination_id = d.destination_id
      WHERE tp.package_id = ?`,
      [id]
    );

    if (pkgRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Package not found' });
    }

    const pkg = pkgRows[0];

    // Moods
    const moods = await getMoods(id);

    // Hotels linked to this package
    const [addOns] = await db.query(
      'SELECT name, price FROM AddOns WHERE package_id = ?',
      [id]
    ).catch(() => [[]]);

    // Hotels linked to this package
    const [hotels] = await db.query(
      `SELECT h.hotel_name, h.room_types, h.price_per_night, h.rating, h.status_availability
       FROM Hotels h
       JOIN PackageHotels ph ON h.hotel_id = ph.hotel_id
       WHERE ph.package_id = ?`,
      [id]
    ).catch(() => [[]]);

    // Flights linked to this package
    const [flights] = await db.query(
      `SELECT f.airline_name, f.departure_location, f.departure_time, f.arrival_location, f.arrival_time, f.price
       FROM Flights f
       JOIN PackageFlights pf ON f.flight_id = pf.flight_id
       WHERE pf.package_id = ?`,
      [id]
    ).catch(() => [[]]);

    // Tours linked to this package
    const [tours] = await db.query(
      `SELECT t.tour_name, t.duration, t.included_services, t.price
       FROM Tours t
       JOIN PackageTours pt ON t.tour_id = pt.tour_id
       WHERE pt.package_id = ?`,
      [id]
    ).catch(() => [[]]);

    return res.status(200).json({
      status: 'success',
      data: {
        package_id: pkg.package_id,
        package_name: pkg.package_name,
        description: pkg.description,
        destination: {
          city: pkg.city,
          country: pkg.country,
          description: pkg.destination_description,
          climate_info: pkg.climate_info,
        },
        travel_date: pkg.travel_date,
        return_date: pkg.return_date,
        duration: pkg.duration,
        total_price: pkg.total_price,
        available_slots: pkg.available_slots,
        status_availability: pkg.status_availability,
        moods,
        add_ons: addOns,
        hotels,
        flights,
        tours,
      },
    });
  } catch (err) {
    console.error('getOnePackage error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// ROUTE 3 — GET /api/packages/recommendations/:userId
// Returns up to 4 packages based on user history
// ─────────────────────────────────────────────
const getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get moods from wishlist packages
    const [wishlistMoods] = await db.query(
      `SELECT DISTINCT pm.mood
       FROM Wishlists w
       JOIN PackageMoods pm ON w.package_id = pm.package_id
       WHERE w.user_id = ?`,
      [userId]
    ).catch(() => [[]]);

    // Get destination IDs from past bookings
    const [bookedDestinations] = await db.query(
      `SELECT DISTINCT tp.destination_id
       FROM Bookings b
       JOIN TravelPackages tp ON b.package_id = tp.package_id
       WHERE b.customer_id = ?`,
      [userId]
    ).catch(() => [[]]);

    const moodNames = wishlistMoods.map((r) => r.mood);
    const destIds = bookedDestinations.map((r) => r.destination_id);

    let packages = [];

    if (moodNames.length === 0 && destIds.length === 0) {
      // No history — return 3 random active packages
      const [random] = await db.query(
        `SELECT tp.package_id, tp.package_name,
                d.city, d.country,
                tp.travel_date, tp.return_date,
                tp.duration, tp.total_price,
                tp.available_slots
         FROM TravelPackages tp
         JOIN Destinations d ON tp.destination_id = d.destination_id
         WHERE tp.status_availability = 'active'
         ORDER BY RAND()
         LIMIT 3`
      );
      packages = random;
    } else {
      // Build a query matching moods OR destinations
      let recQuery = `
        SELECT DISTINCT
          tp.package_id, tp.package_name,
          d.city, d.country,
          tp.travel_date, tp.return_date,
          tp.duration, tp.total_price,
          tp.available_slots
        FROM TravelPackages tp
        JOIN Destinations d ON tp.destination_id = d.destination_id
        LEFT JOIN PackageMoods pm ON tp.package_id = pm.package_id
        WHERE tp.status_availability = 'active'
      `;

      const recParams = [];
      const conditions = [];

      if (moodNames.length > 0) {
        conditions.push(`pm.mood IN (${moodNames.map(() => '?').join(',')})`);
        recParams.push(...moodNames);
      }

      if (destIds.length > 0) {
        conditions.push(`tp.destination_id IN (${destIds.map(() => '?').join(',')})`);
        recParams.push(...destIds);
      }

      recQuery += ' AND (' + conditions.join(' OR ') + ')';
      recQuery += ' ORDER BY RAND() LIMIT 4';

      const [recs] = await db.query(recQuery, recParams);
      packages = recs;
    }

    // Attach moods to each
    const result = await Promise.all(
      packages.map(async (pkg) => ({
        package_id: pkg.package_id,
        package_name: pkg.package_name,
        destination: { city: pkg.city, country: pkg.country },
        travel_date: pkg.travel_date,
        return_date: pkg.return_date,
        duration: pkg.duration,
        total_price: pkg.total_price,
        available_slots: pkg.available_slots,
        moods: await getMoods(pkg.package_id),
      }))
    );

    return res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    console.error('getRecommendations error:', err);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

module.exports = { getAllPackages, getOnePackage, getRecommendations };