const express = require('express');
const { getBoardAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

// mergeParams: true lets this router access :id from the parent router (boardRoutes)
const router = express.Router({ mergeParams: true });

router.use(protect);

// @route   GET /api/boards/:id/analytics
// @desc    Get analytics for a board (stats, charts, team activity)
// @access  Private (board members)
router.get('/', getBoardAnalytics);

module.exports = router;
