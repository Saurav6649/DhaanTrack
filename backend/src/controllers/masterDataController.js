import * as masterDataService from '../services/masterDataService.js';

export const getMasterData = async (req, res, next) => {
  try {
    const data = await masterDataService.getMasterDataList();
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMasterData = async (req, res, next) => {
  try {
    const { key, value, description } = req.body;
    const updated = await masterDataService.updateMasterData(key, value, description, req.user);
    res.json({
      success: true,
      message: 'Master configuration updated.',
      data: { masterData: updated },
    });
  } catch (error) {
    next(error);
  }
};
