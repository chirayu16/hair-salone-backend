const express = require('express');
const {
  createAppointment,
  getMyAppointments,
  getSalonAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
} = require('../controllers/appointmentController');
// MODIFIED: Import 'admin' middleware
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// Create appointment (Any logged-in user)
router.route('/')
  .post(protect, createAppointment); // No change

// Get user's own appointments (The logged-in user)
router.route('/myappointments')
  .get(protect, getMyAppointments); // No change

// Get appointments for a specific salon (Admin Only)
router.route('/salon/:id')
  // MODIFIED: Added 'admin' middleware
  .get(protect, admin, getSalonAppointments);

// Get specific appointment by ID (Booker or Admin) & Cancel appointment (Booker or Admin)
router.route('/:id')
  .get(protect, getAppointmentById)   // No change (controller handles Booker/Admin logic)
  .delete(protect, cancelAppointment); // No change (controller handles Booker/Admin logic)

// Update appointment status (Admin Only)
router.route('/:id/status')
  // MODIFIED: Added 'admin' middleware
  .put(protect, admin, updateAppointmentStatus);
  


module.exports = router;