const express       = require('express');
const { ObjectId }  = require('mongodb');
const { connect }   = require('../config/mongo');
const router        = express.Router();

/**
 * Wraps async route handlers to forward errors to Express error middleware.
 * @param {Function} fn async route handler
 */
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// —————————————————————————————————————————
// ———————— Shared Utilities ————————
// —————————————————————————————————————————

/**
 * Convert MongoDB ObjectId to string in a single document.
 * @param {Object} doc
 * @returns {Object} with `_id` as string
 */
function stringifyId(doc) {
  if (doc && doc._id) {
    doc._id = doc._id.toString();
  }
  return doc;
}

/**
 * Convert ObjectId to string in an array of documents.
 * @param {Array<Object>} docs
 */
function stringifyIds(docs) {
  return docs.map(d => stringifyId({ ...d }));
}

/**
 * Alias `_id` to `id` and remove the original `_id` field.
 * @param {Object} doc
 */
function aliasId(doc) {
  if (doc && doc._id) {
    doc.id = doc._id.toString();
    delete doc._id;
  }
  return doc;
}

/**
 * Alias `_id` to `id` for each document in array.
 * @param {Array<Object>} docs
 */
function aliasIds(docs) {
  return docs.map(d => aliasId({ ...d }));
}

/**
 * Retrieve a MongoDB collection by name.
 * @param {string} name
 * @returns {Collection}
 */
async function getCollection(name) {
  const db = await connect();
  return db.collection(name);
}

// —————————————————————————————————————————
// ———————— Service Endpoints ————————
// —————————————————————————————————————————

/**
 * GET /appointments/services
 * List all services, with optional filters and sorting.
 */
router.get('/services', asyncHandler(async (req, res) => {
  const { doctor_id, is_active, is_external, sortBy, sortOrder } = req.query;

  // Build filter object
  const filter = {};
  if (doctor_id) filter.doctor_id = parseInt(doctor_id, 10);
  if (is_active !== undefined)
    filter.is_active = is_active === 'true';
  if (is_external !== undefined)
    filter.is_external_bookable = is_external === 'true';

  // Determine sort options
  const validSort = ['name', 'doctor_id', 'price', 'duration_minutes', 'created_at'];
  const sortField = validSort.includes(sortBy) ? sortBy : 'doctor_id';
  const order     = (sortOrder || 'ASC').toUpperCase() === 'DESC' ? -1 : 1;

  const services = await (await getCollection('services'))
    .find(filter)
    .sort({ [sortField]: order, name: 1 })
    .toArray();

  res.json(aliasIds(services));
}));

/**
 * GET /appointments/services/doctor/:doctor_id
 * List services for a specific doctor.
 */
router.get('/services/doctor/:doctor_id', asyncHandler(async (req, res) => {
  const doctorId = parseInt(req.params.doctor_id, 10);
  const filter   = { doctor_id: doctorId };

  if (req.query.is_active !== undefined)
    filter.is_active = req.query.is_active === 'true';

  const services = await (await getCollection('services'))
    .find(filter)
    .sort({ name: 1 })
    .toArray();

  res.json(aliasIds(services));
}));

/**
 * GET /appointments/services/:id
 * Retrieve a single service by its ObjectId.
 */
router.get('/services/:id', asyncHandler(async (req, res) => {
  const _id = new ObjectId(req.params.id);
  const service = await (await getCollection('services')).findOne({ _id });
  if (!service) return res.status(404).json({ error: 'Service not found' });
  res.json(aliasId(service));
}));

/**
 * POST /appointments/services
 * Create a new service. Requires `name` and `doctor_id`.
 */
router.post('/services', asyncHandler(async (req, res) => {
  const {
    name,
    doctor_id,
    description = '',
    duration_minutes = 30,
    price = 0,
    is_external_bookable = false
  } = req.body;

  // Validate required fields
  if (!name || doctor_id == null) {
    return res.status(400).json({ error: 'Name and doctor_id are required' });
  }

  const now = new Date();
  const doc = {
    name,
    doctor_id,
    description,
    duration_minutes,
    price,
    is_active: true,
    is_external_bookable,
    created_at: now,
    updated_at: now
  };

  const { insertedId } = await (await getCollection('services')).insertOne(doc);
  doc.id = insertedId.toString();
  res.status(201).json(doc);
}));

/**
 * PUT /appointments/services/:id
 * Update fields on an existing service.
 */
router.put('/services/:id', asyncHandler(async (req, res) => {
  const {
    name,
    description,
    duration_minutes,
    price,
    is_active,
    is_external_bookable
  } = req.body;

  const updates = {
    $set: {
      name,
      description,
      duration_minutes,
      price,
      is_active,
      is_external_bookable,
      updated_at: new Date()
    }
  };

  const _id = new ObjectId(req.params.id);
  const result = await (await getCollection('services'))
    .findOneAndUpdate({ _id }, updates, { returnDocument: 'after' });

  if (!result.value) {
    return res.status(404).json({ error: 'Service not found' });
  }

  res.json(aliasId(result.value));
}));

/**
 * DELETE /appointments/services/:id
 * Only allow deletion if the service is not referenced by any appointment.
 */
router.delete('/services/:id', asyncHandler(async (req, res) => {
  const _id = new ObjectId(req.params.id);
  const apptInUse = await (await getCollection('appointments'))
    .findOne({ service_id: _id });

  if (apptInUse) {
    return res.status(400).json({ error: 'Cannot delete: service in use' });
  }

  const result = await (await getCollection('services'))
    .findOneAndDelete({ _id });

  if (!result.value) {
    return res.status(404).json({ error: 'Service not found' });
  }

  res.json({ message: 'Service deleted successfully' });
}));

// —————————————————————————————————————————
// ———————— Appointment Helpers ————————
// —————————————————————————————————————————

/**
 * Fetch appointments joined with their service metadata.
 * @param {Object} filter MongoDB match filter
 * @param {Object} options e.g. { sort: { appointment_date: 1 } }
 */
async function fetchAppointmentsWithService(filter, options = {}) {
  const pipeline = [
    { $match: filter },
    {
      $lookup: {
        from: 'services',
        localField: 'service_id',
        foreignField: '_id',
        as: 'service'
      }
    },
    { $unwind: '$service' },
    {
      $project: {
        _id: 1,
        patient_id: 1,
        patient_full_name: 1,
        patient_email: 1,
        patient_codice_fiscale: 1,
        patient_phone: 1,
        doctor_id: 1,
        service_id: 1,
        code: 1,
        appointment_date: 1,
        status: 1,
        notes: 1,
        created_at: 1,
        updated_at: 1,
        // service metadata:
        service_name: '$service.name',
        service_description: '$service.description',
        duration_minutes: '$service.duration_minutes',
        price: '$service.price'
      }
    },
    { $sort: options.sort || { appointment_date: 1 } }
  ];

  const docs = await (await getCollection('appointments'))
    .aggregate(pipeline)
    .toArray();

  return aliasIds(docs);
}

// —————————————————————————————————————————
// ———————— Appointment Endpoints ————————
// —————————————————————————————————————————

/**
 * GET /appointments
 * List appointments with optional filtering by date, doctor, patient, etc.
 */
router.get('/', asyncHandler(async (req, res) => {
  const { date, doctor_id, patient_id, service_id, patient_email, patient_codice_fiscale, code } = req.query;
  const filter = {};

  // Date filter: full-day range
  if (date) {
    const d = new Date(date);
    filter.appointment_date = {
      $gte: new Date(d.setHours(0,0,0)),
      $lt:  new Date(d.setHours(23,59,59))
    };
  }
  if (doctor_id)    filter.doctor_id    = parseInt(doctor_id, 10);
  if (patient_id)   filter.patient_id   = parseInt(patient_id, 10);
  if (service_id)   filter.service_id   = new ObjectId(service_id);
  if (patient_email)
    filter.patient_email = { $regex: `^${patient_email}$`, $options: 'i' };
  if (patient_codice_fiscale)
    filter.patient_codice_fiscale = { $regex: `^${patient_codice_fiscale}$`, $options: 'i' };
  if (code)
    filter.code = { $regex: `^${code}$`, $options: 'i' };

  console.log('GET /appointments - Using filter criteria:', filter);

  // Retrieve all appointments before filtering for debugging purposes
  const allAppointments = await (await getCollection('appointments')).find({}).toArray();
  console.log(`GET /appointments - Retrieved ${allAppointments.length} appointments BEFORE filtering.`);
  console.log(JSON.stringify(allAppointments, null, 2));

  // Retrieve filtered appointments with service metadata
  const appointments = await fetchAppointmentsWithService(filter);
  console.log(`GET /appointments - Retrieved ${appointments.length} appointments AFTER applying filter.`);
  console.log(JSON.stringify(appointments, null, 2));

  res.json(appointments);
}));

/**
 * GET /appointments/:id
 * Retrieve a single appointment by its ObjectId.
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const filter = { _id: new ObjectId(req.params.id) };
  const results = await fetchAppointmentsWithService(filter);
  if (!results.length) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  res.json(results[0]);
}));

/**
 * POST /appointments
 * Create a new appointment. Validates doctor/service consistency.
 */
router.post('/', asyncHandler(async (req, res) => {
  const {
    patient_full_name,
    doctor_id,
    service_id,
    appointment_date,
    patient_id:rawPatientId = null,
    patient_email = '',
    patient_codice_fiscale = '',
    patient_phone = '',
    notes = '',
    status = 'scheduled',
    customFields = []
  } = req.body;

  const patient_id = rawPatientId !== null ? parseInt(rawPatientId, 10) : null;

  // Required fields check
  if (!patient_full_name || !doctor_id || !service_id || !appointment_date) {
    return res.status(400)
      .json({ error: 'patient_full_name, doctor_id, service_id and appointment_date are required' });
  }

  // Ensure service exists and is active for that doctor
  const svc = await (await getCollection('services')).findOne({
    _id: new ObjectId(service_id),
    doctor_id,
    is_active: true
  });
  if (!svc) {
    return res.status(400).json({ error: 'Service not available for this doctor' });
  }

  // Generate unique code
  const code = `APT-${Date.now().toString().slice(-6)}`;
  const now  = new Date();
  const doc = {
    patient_id,
    patient_full_name,
    patient_email,
    patient_codice_fiscale,
    patient_phone,
    doctor_id,
    service_id: svc._id,
    code,
    appointment_date: new Date(appointment_date),
    notes,
    status,
    customFields,
    created_at: now,
    updated_at: now
  };

  const { insertedId } = await (await getCollection('appointments')).insertOne(doc);
  doc.id = insertedId.toString();

  // Return with service metadata
  const saved = await fetchAppointmentsWithService({ _id: insertedId });
  res.status(201).json(saved[0]);
}));

/**
 * PUT /appointments/:id
 * Update an existing appointment. Only whitelist allowed fields.
 */
router.put('/:id', asyncHandler(async (req, res) => {  const allowedFields = [
    'patient_id','patient_full_name','patient_email',
    'patient_codice_fiscale','patient_phone',
    'doctor_id','notes','status','customFields'
  ];
  const updateset = {};

  // Whitelist
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updateset[field] = req.body[field];
    }
  }
  if (req.body.service_id) {
    updateset.service_id = new ObjectId(req.body.service_id);
  }
  if (req.body.appointment_date) {
    updateset.appointment_date = new Date(req.body.appointment_date);
  }
  updateset.updated_at = new Date();

  const result = await (await getCollection('appointments'))
    .findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updateset },
      { returnDocument: 'after' }
    );

  if (!result.value) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  const updated = await fetchAppointmentsWithService({ _id: result.value._id });
  res.json(updated[0]);
}));

/**
 * PUT /appointments/:id/status
 * Change only the status of an appointment. Enforces allowed statuses.
 */
router.put('/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['scheduled', 'in_progress', 'completed', 'cancelled'];

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const result = await (await getCollection('appointments'))
    .findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: { status, updated_at: new Date() } },
      { returnDocument: 'after' }
    );

  if (!result.value) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  const updated = await fetchAppointmentsWithService({ _id: result.value._id });
  res.json(updated[0]);
}));

/**
 * DELETE /appointments/:id
 * Remove an appointment by its ObjectId.
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const result = await (await getCollection('appointments'))
    .findOneAndDelete({ _id: new ObjectId(req.params.id) });

  if (!result.value) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  res.json({ message: 'Appointment deleted successfully' });
}));

/**
 * GET /appointments/doctor/:doctor_id/busy-slots
 * List busy time slots for a doctor, optionally within a date or range.
 */
router.get('/doctor/:doctor_id/busy-slots', asyncHandler(async (req, res) => {
  const doctorId = parseInt(req.params.doctor_id, 10);
  const filter = {
    doctor_id: doctorId,
    status: { $in: ['scheduled', 'in_progress'] }
  };

  // Date vs. range filtering
  if (req.query.start_date && req.query.end_date) {
    filter.appointment_date = {
      $gte: new Date(req.query.start_date),
      $lte: new Date(req.query.end_date)
    };
  } else if (req.query.date) {
    const d = new Date(req.query.date);
    filter.appointment_date = {
      $gte: new Date(d.setHours(0,0,0)),
      $lt:  new Date(d.setHours(23,59,59))
    };
  } else {
    filter.appointment_date = { $gte: new Date() };
  }

  const appts = await (await getCollection('appointments'))
    .find(filter)
    .sort({ appointment_date: 1 })
    .toArray();

  // Map each appointment to its busy slot window
  const slots = appts.map(a => ({
    start_time: a.appointment_date,
    end_time: new Date(a.appointment_date.getTime() + ((a.duration_minutes || 30) * 60000))
  }));

  res.json(slots);
}));

module.exports = router;
