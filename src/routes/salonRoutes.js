const express = require('express');
const {
  getSalons,
  getSalonById,
  createSalon,
  updateSalon,
  deleteSalon,
} = require('../controllers/salonController');
// MODIFIED: Import 'admin' middleware
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all salons (Public) & Create salon (Admin Only)
router.route('/')
  .get(getSalons)
  // MODIFIED: Added 'admin' middleware
  .post(protect, admin, createSalon);

// Get salon by ID (Public), Update salon (Admin Only), Delete salon (Admin Only)
router.route('/:id')
  .get(getSalonById)
  // MODIFIED: Added 'admin' middleware
  .put(protect, admin, updateSalon)
  // MODIFIED: Added 'admin' middleware
  .delete(protect, admin, deleteSalon);

module.exports = router;