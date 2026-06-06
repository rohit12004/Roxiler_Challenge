const userService = require('../services/user.service');

const register = async (req, res) => {
  const { name, email, password, address, role } = req.body;

  try {
    const user = await userService.registerUser({ name, email, password, address, role });
    
    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully.',
      data: { user }
    });
  } catch (error) {
    if (error.message === 'EMAIL_IN_USE') {
      return res.status(409).json({
        status: 'fail',
        message: 'Email address is already in use.'
      });
    }
    console.error('Registration Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to register user due to an internal server error.'
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'unknown';

  try {
    const result = await userService.loginUser({ email, password, ip, userAgent });

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: result.expiresAt
    });

    return res.status(200).json({
      status: 'success',
      message: 'Logged in successfully.',
      data: {
        accessToken: result.accessToken,
        user: result.user
      }
    });
  } catch (error) {
    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password.'
      });
    }
    console.error('Login Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to authenticate user.'
    });
  }
};

const refresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  const ip = req.ip || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'unknown';

  if (!refreshToken) {
    return res.status(401).json({
      status: 'fail',
      message: 'Refresh token is missing.'
    });
  }

  try {
    const result = await userService.refreshSession(refreshToken, ip, userAgent);
    
    // Set rotated refresh token in HttpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: result.expiresAt
    });

    return res.status(200).json({
      status: 'success',
      data: {
        accessToken: result.accessToken,
        user: result.user
      }
    });
  } catch (error) {
    if (error.message !== 'INVALID_TOKEN' && error.message !== 'USER_NOT_FOUND') {
      console.error('Token Refresh Controller Error:', error);
    }
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid or expired refresh token.'
    });
  }
};

const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  try {
    await userService.revokeSession(refreshToken);

    // Clear refresh token cookie on client
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully.'
    });
  } catch (error) {
    console.error('Logout Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to log out.'
    });
  }
};

const logoutAll = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      status: 'fail',
      message: 'Refresh token is missing.'
    });
  }

  try {
    await userService.revokeAllSessions(refreshToken);

    // Clear refresh token cookie on client
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return res.status(200).json({
      status: 'success',
      message: 'Logged out from all devices successfully.'
    });
  } catch (error) {
    if (error.message === 'INVALID_TOKEN') {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid or expired refresh token.'
      });
    }
    console.error('Logout All Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to log out from all devices.'
    });
  }
};

const me = async (req, res) => {
  try {
    const user = await userService.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User profile not found.'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    console.error('Profile Retrieval Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user profile.'
    });
  }
};

const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    await userService.updateUserPassword(req.user.id, currentPassword, newPassword);

    return res.status(200).json({
      status: 'success',
      message: 'Password updated successfully.'
    });
  } catch (error) {
    if (error.message === 'INVALID_PASSWORD') {
      return res.status(400).json({
        status: 'fail',
        message: 'Incorrect current password.'
      });
    }
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found.'
      });
    }
    console.error('Update Password Controller Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update password due to an internal server error.'
    });
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  me,
  updatePassword
};
