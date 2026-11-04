import * as expenseService from '../services/expenseService.js';

export const createExpense = async (req, res, next) => {
  try {
    const expense = await expenseService.createExpense(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Expense added successfully.',
      data: { expense },
    });
  } catch (error) {
    next(error);
  }
};

export const getExpenses = async (req, res, next) => {
  try {
    const expenses = await expenseService.getExpenses(req.query, req.user);
    res.json({
      success: true,
      data: { expenses },
    });
  } catch (error) {
    next(error);
  }
};

export const getExpenseTotals = async (req, res, next) => {
  try {
    const totals = await expenseService.getExpenseTotals(req.user);
    res.json({
      success: true,
      data: totals,
    });
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req, res, next) => {
  try {
    const updated = await expenseService.updateExpense(req.params.id, req.body, req.user);
    res.json({
      success: true,
      message: 'Expense updated successfully.',
      data: { expense: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const deleted = await expenseService.deleteExpense(req.params.id, req.user);
    res.json({
      success: true,
      message: 'Expense moved to Recycle Bin successfully.',
      data: { expense: deleted },
    });
  } catch (error) {
    next(error);
  }
};
