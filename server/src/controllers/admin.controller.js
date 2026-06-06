const adminService = require('../services/admin.service');

const getStats = async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    return res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    console.error('Admin Stats Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve administrative statistics.'
    });
  }
};

const addUser = async (req, res) => {
  const { name, email, password, address, role } = req.body;

  try {
    const user = await adminService.createUser({ name, email, password, address, role });
    return res.status(201).json({
      status: 'success',
      message: 'Account created successfully by administrator.',
      data: { user }
    });
  } catch (error) {
    if (error.message === 'EMAIL_IN_USE') {
      return res.status(409).json({
        status: 'fail',
        message: 'Email address is already in use.'
      });
    }
    console.error('Admin Add User Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create account due to an internal server error.'
    });
  }
};

const resetPassword = async (req, res) => {
  const { userId } = req.body;

  try {
    const temporaryPassword = await adminService.resetUserPassword(userId);
    return res.status(200).json({
      status: 'success',
      message: 'Password reset successful.',
      data: { temporaryPassword }
    });
  } catch (error) {
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({
        status: 'fail',
        message: 'Account not found.'
      });
    }
    console.error('Admin Reset Password Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to reset user password.'
    });
  }
};

const getUsers = async (req, res) => {
  const { search, role } = req.query;

  try {
    const users = await adminService.listUsers({ search, role });
    return res.status(200).json({
      status: 'success',
      data: { users }
    });
  } catch (error) {
    console.error('Admin Get Users Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user listing.'
    });
  }
};

const getStores = async (req, res) => {
  const { search } = req.query;

  try {
    const stores = await adminService.listStores({ search });
    return res.status(200).json({
      status: 'success',
      data: { stores }
    });
  } catch (error) {
    console.error('Admin Get Stores Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve store listing.'
    });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await adminService.getUserDetails(id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'Account not found.'
      });
    }
    return res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    console.error('Admin Get User Details Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch account details.'
    });
  }
};

module.exports = {
  getStats,
  addUser,
  resetPassword,
  getUsers,
  getStores,
  getUserById
};
