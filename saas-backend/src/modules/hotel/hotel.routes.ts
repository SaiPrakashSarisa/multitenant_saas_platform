import { Router } from 'express';
import { HotelController } from './hotel.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ===== TABLE ROUTES =====

/**
 * @route   POST /api/hotel/tables
 * @desc    Create new table
 * @access  Private
 */
router.post('/tables', HotelController.createTable);

/**
 * @route   GET /api/hotel/tables
 * @desc    Get all tables (with filters)
 * @access  Private
 */
router.get('/tables', HotelController.getTables);

/**
 * @route   GET /api/hotel/tables/:id
 * @desc    Get table by ID
 * @access  Private
 */
router.get('/tables/:id', HotelController.getTableById);

/**
 * @route   PUT /api/hotel/tables/:id
 * @desc    Update table
 * @access  Private
 */
router.put('/tables/:id', HotelController.updateTable);

/**
 * @route   DELETE /api/hotel/tables/:id
 * @desc    Delete table
 * @access  Private
 */
router.delete('/tables/:id', HotelController.deleteTable);

// ===== RESERVATION ROUTES =====

/**
 * @route   POST /api/hotel/reservations
 * @desc    Create new reservation
 * @access  Private
 */
router.post('/reservations', HotelController.createReservation);

/**
 * @route   GET /api/hotel/reservations
 * @desc    Get all reservations (with filters)
 * @access  Private
 */
router.get('/reservations', HotelController.getReservations);

/**
 * @route   GET /api/hotel/reservations/:id
 * @desc    Get reservation by ID
 * @access  Private
 */
router.get('/reservations/:id', HotelController.getReservationById);

/**
 * @route   PUT /api/hotel/reservations/:id
 * @desc    Update reservation
 * @access  Private
 */
router.put('/reservations/:id', HotelController.updateReservation);

/**
 * @route   DELETE /api/hotel/reservations/:id
 * @desc    Cancel reservation
 * @access  Private
 */
router.delete('/reservations/:id', HotelController.cancelReservation);

/**
 * @route   GET /api/hotel/stats
 * @desc    Get hotel statistics
 * @access  Private
 */
router.get('/stats', HotelController.getStats);

export default router;
