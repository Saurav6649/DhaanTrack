import * as recycleBinService from '../services/recycleBinService.js';

export const getDeletedRecords = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const data = await recycleBinService.getDeletedRecords({ category, search });
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const permanentDeleteRecord = async (req, res, next) => {
  try {
    const { module, id } = req.params;
    const result = await recycleBinService.permanentDeleteRecord(module, id, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const permanentDeleteBatch = async (req, res, next) => {
  try {
    const { items } = req.body;
    const result = await recycleBinService.permanentDeleteBatch(items, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const permanentDeleteCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const result = await recycleBinService.permanentDeleteCategory(category, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const restoreRecord = async (req, res, next) => {
  try {
    const { module, id } = req.params;
    const result = await recycleBinService.restoreRecord(module, id, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
