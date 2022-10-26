const express = require('express');
const router = express.Router();

// controllers
const DashboardAPI = require('../app/controllers/DashboardAPI');

// ./api/dashboard
router.get('/', DashboardAPI.dashboardALL);
router.get('/countproduct', DashboardAPI.countProduct);
router.get('/countorder', DashboardAPI.countOrder);
router.get('/countuser', DashboardAPI.countUser);
router.get('/sale', DashboardAPI.sumSales);
router.get('/graph', DashboardAPI.revenueGraph);
router.get('/trend', DashboardAPI.trend);
router.get('/history', DashboardAPI.historyOrder);

module.exports = router;
