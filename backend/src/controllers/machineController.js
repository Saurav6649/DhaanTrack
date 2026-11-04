import * as machineService from '../services/machineService.js';

export const createMachine = async (req, res, next) => {
  try {
    const machine = await machineService.createMachine(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Machine created successfully.',
      data: { machine },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllMachines = async (req, res, next) => {
  try {
    const machines = await machineService.getAllMachines();
    res.json({
      success: true,
      data: { machines },
    });
  } catch (error) {
    next(error);
  }
};

export const getMachineById = async (req, res, next) => {
  try {
    const machine = await machineService.getMachineById(req.params.id);
    res.json({
      success: true,
      data: { machine },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMachine = async (req, res, next) => {
  try {
    const machine = await machineService.updateMachine(req.params.id, req.body, req.user);
    res.json({
      success: true,
      message: 'Machine updated successfully.',
      data: { machine },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMachine = async (req, res, next) => {
  try {
    const machine = await machineService.deleteMachine(req.params.id, req.user);
    res.json({
      success: true,
      message: 'Machine moved to Recycle Bin successfully.',
      data: { machine },
    });
  } catch (error) {
    next(error);
  }
};
