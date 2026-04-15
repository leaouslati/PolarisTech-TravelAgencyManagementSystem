// controllers/packageController.js

const db = require('../config/db'); // adjust path if your db connection file is named differently

// ─────────────────────────────────────────────
// Helper: fetch moods array for a package
// ─────────────────────────────────────────────
async function getMoods(packageId) {
  const [rows] = await db.query(
    'SELECT MoodName FROM PackageMoods WHERE PackageID = ?',
    [packageId]
  );
  return rows.map((r) => r.MoodName);
}

// ─────────────────────────────────────────────
// ROUTE 1 — GET /api/packages
// Query params: destination, minPrice, maxPrice, mood, date
// ─────────────────────────────────────────────
const getAllPackages = async (req, res) => {
  try {
    const { destination, minPrice, maxPrice, mood, date } = req.query;

    let query = `
      SELECT DISTINCT
        tp.PackageID   AS package_id,
        tp.PackageName AS package_name,
        d.City         AS city,
        d.Country      AS country,
        tp.TravelDate  AS travel_date,
        tp.ReturnDate  AS return_date,
        tp.Duration    AS duration,
        tp.TotalPrice  AS total_price,
        tp.AvailableSlots AS available_slots,
        tp.StatusAvailability AS status_availability
      FROM TravelPackages tp
      JOIN Destinations d ON tp.DestinationID = d.DestinationID
      LEFT JOIN PackageMoods pm ON tp.PackageID = pm.PackageID
      WHERE tp.StatusAvailability = 'active'
    `;

    const params = [];

    if (destination) {
      query += ' AND (d.City LIKE ? OR d.Country LIKE ?)';
      params.push(`%${destination}%`, `%${destination}%`);
    }

    if (minPrice) {
      query += ' AND tp.TotalPrice >= ?';
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      query += ' AND tp.TotalPrice <= ?';
      params.push(Number(maxPrice));
    }

    if (mood) {
      query += ' AND pm.MoodName = ?';
      params.push(mood);
    }

    if (date) {
      query += ' AND tp.TravelDate = ?';
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
const getOnePackage = async (req, res) => {
  try {
    const { id } = req.params;

    // Main package + destination
    const [pkgRows] = await db.query(
      `SELECT
        tp.PackageID   AS package_id,
        tp.PackageName AS package_name,
        tp.Description AS description,
        d.City         AS city,
        d.Country      AS country,
        d.Description  AS destination_description,
        d.ClimateInfo  AS climate_info,
        tp.TravelDate  AS travel_date,
        tp.ReturnDate  AS return_date,
        tp.Duration    AS duration,
        tp.TotalPrice  AS total_price,
        tp.AvailableSlots AS available_slots,
        tp.StatusAvailability AS status_availability
      FROM TravelPackages tp
      JOIN Destinations d ON tp.DestinationID = d.DestinationID
      WHERE tp.PackageID = ?`,
      [id]
    );

    if (pkgRows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Package not found' });
    }

    const pkg = pkgRows[0];

    // Moods
    const moods = await getMoods(id);

    // Add-ons (if you have a PackageAddOns table — adjust column names if needed)
    const [addOns] = await db.query(
      'SELECT AddOnName AS name, Price AS price FROM PackageAddOns WHERE PackageID = ?',
      [id]
    ).catch(() => [[]]);  // returns empty if table doesn't exist yet

    // Hotels linked to this package
    const [hotels] = await db.query(
      `SELECT h.HotelName, h.RoomTypes, h.PricePerNight, h.Rating, h.StatusAvailability
       FROM Hotels h
       JOIN PackageHotels ph ON h.HotelID = ph.HotelID
       WHERE ph.PackageID = ?`,
      [id]
    ).catch(() => [[]]);

    // Flights linked to this package
    const [flights] = await db.query(
      `SELECT f.AirlineName, f.DepartureLocation, f.DepartureTime, f.ArrivalLocation, f.ArrivalTime, f.Price
       FROM Flights f
       JOIN PackageFlights pf ON f.FlightID = pf.FlightID
       WHERE pf.PackageID = ?`,
      [id]
    ).catch(() => [[]]);

    // Tours linked to this package
    const [tours] = await db.query(
      `SELECT t.TourName, t.Duration, t.IncludedServices, t.Price
       FROM Tours t
       JOIN PackageTours pt ON t.TourID = pt.TourID
       WHERE pt.PackageID = ?`,
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
      `SELECT DISTINCT pm.MoodName
       FROM Wishlists w
       JOIN PackageMoods pm ON w.PackageID = pm.PackageID
       WHERE w.CustomerID = ?`,
      [userId]
    );

    // Get destination IDs from past bookings
    const [bookedDestinations] = await db.query(
      `SELECT DISTINCT tp.DestinationID
       FROM Bookings b
       JOIN TravelPackages tp ON b.PackageID = tp.PackageID
       WHERE b.CustomerID = ?`,
      [userId]
    );

    const moodNames = wishlistMoods.map((r) => r.MoodName);
    const destIds = bookedDestinations.map((r) => r.DestinationID);

    let packages = [];

    if (moodNames.length === 0 && destIds.length === 0) {
      // No history — return 3 random active packages
      const [random] = await db.query(
        `SELECT tp.PackageID AS package_id, tp.PackageName AS package_name,
                d.City AS city, d.Country AS country,
                tp.TravelDate AS travel_date, tp.ReturnDate AS return_date,
                tp.Duration AS duration, tp.TotalPrice AS total_price,
                tp.AvailableSlots AS available_slots
         FROM TravelPackages tp
         JOIN Destinations d ON tp.DestinationID = d.DestinationID
         WHERE tp.StatusAvailability = 'active'
         ORDER BY RAND()
         LIMIT 3`
      );
      packages = random;
    } else {
      // Build a query matching moods OR destinations
      let recQuery = `
        SELECT DISTINCT
          tp.PackageID AS package_id, tp.PackageName AS package_name,
          d.City AS city, d.Country AS country,
          tp.TravelDate AS travel_date, tp.ReturnDate AS return_date,
          tp.Duration AS duration, tp.TotalPrice AS total_price,
          tp.AvailableSlots AS available_slots
        FROM TravelPackages tp
        JOIN Destinations d ON tp.DestinationID = d.DestinationID
        LEFT JOIN PackageMoods pm ON tp.PackageID = pm.PackageID
        WHERE tp.StatusAvailability = 'active'
      `;

      const recParams = [];
      const conditions = [];

      if (moodNames.length > 0) {
        conditions.push(`pm.MoodName IN (${moodNames.map(() => '?').join(',')})`);
        recParams.push(...moodNames);
      }

      if (destIds.length > 0) {
        conditions.push(`tp.DestinationID IN (${destIds.map(() => '?').join(',')})`);
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
        ...pkg,
        destination: { city: pkg.city, country: pkg.country },
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