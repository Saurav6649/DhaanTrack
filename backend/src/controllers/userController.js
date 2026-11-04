import * as userService from '../services/userService.js';

export const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const getCombinedUsers = async (req, res, next) => {
  try {
    const users = await userService.getCombinedUsersAndMachines();
    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserMachineDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    const details = await userService.getUserMachineDetail(id, { startDate, endDate });
    res.json({
      success: true,
      data: details,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await userService.updateUser(id, req.body, req.user);
    res.json({
      success: true,
      message: 'User updated successfully.',
      data: { user: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const result = await userService.resetPassword(id, newPassword, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.disableUser(id, req.user);
    res.json({
      success: true,
      message: `User status changed to ${user.status}.`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.deleteUser(id, req.user);
    res.json({
      success: true,
      message: 'User moved to Recycle Bin successfully.',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
