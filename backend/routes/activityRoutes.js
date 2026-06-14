const express = require('express');
const { getBoardActivity } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

// mergeParams: true lets this router access :id from the parent router (boardRoutes)
const router = express.Router({ mergeParams: true });

router.use(protect);

// @route   GET /api/boards/:id/activity
// @desc    Get the activity timeline for a board (most recent first)
// @access  Private (board members)
router.get('/', getBoardActivity);

module.exports = router;
