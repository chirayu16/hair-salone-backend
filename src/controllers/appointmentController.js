const Appointment = require('../models/appointmentModel');
const Salon = require('../models/salonModel'); // Ensure Salon model is imported

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private
const createAppointment = async (req, res) => {
  // ... (No changes needed in this function - any logged-in user can create) ...
   try {
    const {
      salon: salonId,
      service: serviceId,
      date,
      startTime,
      endTime,
      notes,
    } = req.body;

    // Check if salon exists
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    // Find the service
    const service = salon.services.id(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Create appointment
    const appointment = new Appointment({
      user: req.user._id,
      salon: salonId,
      service: serviceId, // Store the service subdocument ID
      date,
      startTime,
      endTime,
      notes,
      totalPrice: service.price, // Get price from the found service
    });

    const createdAppointment = await appointment.save();
    res.status(201).json(createdAppointment);
  } catch (error) {
    // Ensure Mongoose validation errors or CastErrors are handled reasonably
     if (error.name === 'ValidationError' || error.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid input data', error: error.message });
     }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user appointments
// @route   GET /api/appointments/myappointments
// @access  Private
const getMyAppointments = async (req, res) => {
  // ... (No changes needed in this function - user gets their own) ...
  try {
    const appointments = await Appointment.find({ user: req.user._id })
      .populate('salon', 'name address') // Populate salon details
       // Optionally populate service details if service was a ref, but here it's an ID
      .sort({ date: 1, startTime: 1 }); // Sort by date and time

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get salon appointments
// @route   GET /api/appointments/salon/:id
// @access  Private/Admin <--- MODIFIED ACCESS (Enforced in Routes)
const getSalonAppointments = async (req, res) => {
  // NOTE: Authorization (Admin only) is handled by middleware in the route definition
  try {
    // We still need the salon to exist to find appointments for it
    const salonExists = await Salon.findById(req.params.id);
    if (!salonExists) {
        return res.status(404).json({ message: 'Salon not found' });
    }

    // REMOVED: Owner check is removed. Admin middleware handles authorization.
    // if (salon.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    //   return res.status(401).json({ message: 'Not authorized' });
    // }

    const appointments = await Appointment.find({ salon: req.params.id })
      .populate('user', 'name email phoneNumber') // Populate user details
      .sort({ date: 1, startTime: 1 });

    res.json(appointments);
  } catch (error) {
     if (error.name === 'CastError') { // Handle invalid ObjectId format for salon ID
        return res.status(400).json({ message: 'Invalid Salon ID format' });
     }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('salon', 'name address email contactNumber')
      .populate('user', 'name email phoneNumber');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // MODIFIED: Check if user is appointment owner OR admin. Removed salon owner check.
    if (
      appointment.user._id.toString() !== req.user._id.toString() &&
      !req.user.isAdmin // Only the user who booked OR an admin can view
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(appointment);

  } catch (error) {
     if (error.name === 'CastError') { // Handle invalid ObjectId format for appointment ID
        return res.status(400).json({ message: 'Invalid Appointment ID format' });
     }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private/Admin <--- MODIFIED ACCESS (Enforced in Routes)
const updateAppointmentStatus = async (req, res) => {
  // NOTE: Authorization (Admin only) is handled by middleware in the route definition
  try {
    const { status } = req.body;

     // Validate status input
     const validStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];
     if (!status || !validStatuses.includes(status)) {
         return res.status(400).json({ message: 'Invalid status value provided' });
     }

    const appointment = await Appointment.findById(req.params.id);

    if (appointment) {
      // REMOVED: Owner check is removed. Admin middleware handles authorization.
      // const salon = await Salon.findById(appointment.salon);
      // if (salon.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      //   return res.status(401).json({ message: 'Not authorized' });
      // }

      appointment.status = status; // Update status

      const updatedAppointment = await appointment.save();
      res.json(updatedAppointment);
    } else {
      res.status(404).json({ message: 'Appointment not found' });
    }
  } catch (error) {
     if (error.name === 'CastError') { // Handle invalid ObjectId format
        return res.status(400).json({ message: 'Invalid Appointment ID format' });
     }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Cancel appointment (Sets status to 'Cancelled')
// @route   DELETE /api/appointments/:id
// @access  Private
const cancelAppointment = async (req, res) => {
  // NOTE: Allows user who booked OR Admin to cancel. No changes needed here.
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (appointment) {
      // Only the user who created the appointment or an admin can cancel it
      if (appointment.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        return res.status(401).json({ message: 'Not authorized' });
      }

      // Only cancel if it's not already completed or cancelled
      if (appointment.status === 'Completed' || appointment.status === 'Cancelled') {
        return res.status(400).json({ message: `Cannot cancel appointment with status: ${appointment.status}` });
      }

      appointment.status = 'Cancelled';
      await appointment.save();

      res.json({ message: 'Appointment cancelled' });
    } else {
      res.status(404).json({ message: 'Appointment not found' });
    }
  } catch (error) {
     if (error.name === 'CastError') { // Handle invalid ObjectId format
        return res.status(400).json({ message: 'Invalid Appointment ID format' });
     }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  getSalonAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
};