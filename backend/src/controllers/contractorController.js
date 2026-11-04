import * as contractorService from '../services/contractorService.js';

export const createContractor = async (req, res, next) => {
  try {
    const contractor = await contractorService.createContractor(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Contractor created successfully.',
      data: { contractor },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllContractors = async (req, res, next) => {
  try {
    const contractors = await contractorService.getAllContractors();
    res.json({
      success: true,
      data: { contractors },
    });
  } catch (error) {
    next(error);
  }
};

export const getContractorById = async (req, res, next) => {
  try {
    const contractor = await contractorService.getContractorById(req.params.id);
    res.json({
      success: true,
      data: { contractor },
    });
  } catch (error) {
    next(error);
  }
};

export const updateContractor = async (req, res, next) => {
  try {
    const contractor = await contractorService.updateContractor(req.params.id, req.body, req.user);
    res.json({
      success: true,
      message: 'Contractor updated successfully.',
      data: { contractor },
    });
  } catch (error) {
    next(error);
  }
};
