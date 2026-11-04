import * as paymentService from '../services/paymentService.js';

export const createPayment = async (req, res, next) => {
  try {
    const result = await paymentService.createPayment(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentsBySession = async (req, res, next) => {
  try {
    const payments = await paymentService.getPaymentsBySession(req.params.workSessionId, req.user);
    res.json({
      success: true,
      data: { payments },
    });
  } catch (error) {
    next(error);
  }
};

export const deletePayment = async (req, res, next) => {
  try {
    const payment = await paymentService.deletePayment(req.params.id, req.user);
    res.json({
      success: true,
      message: 'Payment moved to Recycle Bin successfully.',
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
};
