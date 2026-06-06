const storeService = require('../services/store.service');

const getStores = async (req, res) => {
  const { search } = req.query;

  try {
    const stores = await storeService.listStoresForUser(req.user.id, { search });
    return res.status(200).json({
      status: 'success',
      data: { stores }
    });
  } catch (error) {
    console.error('Customer Get Stores Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch store directory.'
    });
  }
};

const submitRating = async (req, res) => {
  const { storeId, rating, reviewText } = req.body;

  try {
    const ratingResult = await storeService.upsertRating(req.user.id, { storeId, rating, reviewText });
    return res.status(200).json({
      status: 'success',
      message: ratingResult.updated ? 'Rating updated successfully.' : 'Rating submitted successfully.',
      data: { rating: ratingResult }
    });
  } catch (error) {
    if (error.message === 'STORE_NOT_FOUND') {
      return res.status(404).json({
        status: 'fail',
        message: 'Store account not found.'
      });
    }
    console.error('Customer Submit Rating Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to submit rating due to an internal server error.'
    });
  }
};

const getStoreDashboard = async (req, res) => {
  try {
    const stats = await storeService.getStoreDashboardStats(req.user.id);
    return res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    if (error.message === 'STORE_NOT_FOUND') {
      return res.status(404).json({
        status: 'fail',
        message: 'Store account not found.'
      });
    }
    console.error('Store Dashboard Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve store dashboard statistics.'
    });
  }
};

module.exports = {
  getStores,
  submitRating,
  getStoreDashboard
};
