const express = require('express');
const { getOwnerStats } = require('../controllers/owner.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.use(authorize('owner'));

router.get('/stats', getOwnerStats);

module.exports = router;
