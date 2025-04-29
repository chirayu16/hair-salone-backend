const Salon = require('../models/salonModel');

// @desc    Get all salons
// @route   GET /api/salons
// @access  Public
const getSalons = async (req, res) => {
  // ... (No changes needed in this function) ...
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;

    const keyword = req.query.keyword
      ? {
          name: {
            $regex: req.query.keyword,
            $options: 'i',
          },
        }
      : {};

    const count = await Salon.countDocuments({ ...keyword });
    const salons = await Salon.find({ ...keyword })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({ salons, page, pages: Math.ceil(count / pageSize) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get salon by ID
// @route   GET /api/salons/:id
// @access  Public
const getSalonById = async (req, res) => {
  // ... (No changes needed in this function) ...
  try {
    const salon = await Salon.findById(req.params.id);

    if (salon) {
      res.json(salon);
    } else {
      res.status(404).json({ message: 'Salon not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a salon
// @route   POST /api/salons
// @access  Private/Admin <--- MODIFIED ACCESS (Enforced in Routes)
const createSalon = async (req, res) => {
  // NOTE: Authorization (Admin only) is handled by middleware in the route definition
  try {
    const {
      name,
      description,
      address,
      contactNumber,
      email,
      services,
      workingHours,
    } = req.body;

    const salon = new Salon({
      // Keep owner field for information, but it's not used for auth checks anymore
      // It might be assigned manually or represent the user who *initially* requested it (if workflow allows)
      // Or could be assigned to the creating admin's ID. Let's keep req.user._id for simplicity now.
      owner: req.user._id,
      name,
      description,
      address,
      contactNumber,
      email,
      services: services || [],
      workingHours: workingHours || [],
    });

    const createdSalon = await salon.save();
    res.status(201).json(createdSalon);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a salon
// @route   PUT /api/salons/:id
// @access  Private/Admin <--- MODIFIED ACCESS (Enforced in Routes)
const updateSalon = async (req, res) => {
  // NOTE: Authorization (Admin only) is handled by middleware in the route definition
  try {
    const {
      name,
      description,
      address,
      contactNumber,
      email,
      services,
      workingHours,
    } = req.body;

    const salon = await Salon.findById(req.params.id);

    if (salon) {
      // REMOVED: Owner check is removed. Admin middleware handles authorization.
      // if (salon.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      //   return res.status(401).json({ message: 'Not authorized' });
      // }

      salon.name = name || salon.name;
      salon.description = description || salon.description;
      salon.address = address || salon.address;
      salon.contactNumber = contactNumber || salon.contactNumber;
      salon.email = email || salon.email;
      salon.services = services || salon.services;
      salon.workingHours = workingHours || salon.workingHours;
      // NOTE: Consider if the 'owner' field should be updatable by admin

      const updatedSalon = await salon.save();
      res.json(updatedSalon);
    } else {
      res.status(404).json({ message: 'Salon not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a salon
// @route   DELETE /api/salons/:id
// @access  Private/Admin <--- MODIFIED ACCESS (Enforced in Routes)
const deleteSalon = async (req, res) => {
  // NOTE: Authorization (Admin only) is handled by middleware in the route definition
  try {
    const salon = await Salon.findById(req.params.id);

    if (salon) {
      // REMOVED: Owner check is removed. Admin middleware handles authorization.
      // if (salon.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      //   return res.status(401).json({ message: 'Not authorized' });
      // }

      await salon.remove(); // Use remove() or deleteOne() based on Mongoose version
      res.json({ message: 'Salon removed' });
    } else {
      res.status(404).json({ message: 'Salon not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getSalons,
  getSalonById,
  createSalon,
  updateSalon,
  deleteSalon,
};