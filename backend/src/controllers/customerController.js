import * as customerService from '../services/customerService.js';

export const getShareableUsers = async (req, res, next) => {
  try {
    const users = await customerService.getShareableUsers(req.user);
    res.json({
      success: true,
      data: { users },
      users,
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.createCustomer(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Customer saved and shared successfully.',
      data: { customer },
      customer,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomers = async (req, res, next) => {
  try {
    const result = await customerService.getCustomers(req.query, req.user);
    res.json({
      success: true,
      data: result,
      customers: result.customers,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    res.json({
      success: true,
      data: { customer },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body, req.user);
    res.json({
      success: true,
      message: 'Customer details updated successfully.',
      data: { customer },
    });
  } catch (error) {
    next(error);
  }
};

export const shareCustomer = async (req, res, next) => {
  try {
    const { userIds } = req.body;
    const customer = await customerService.shareCustomer(req.params.id, userIds, req.user);
    res.json({
      success: true,
      message: 'Customer shared successfully.',
      data: { customer },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const result = await customerService.deleteCustomer(req.params.id, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
