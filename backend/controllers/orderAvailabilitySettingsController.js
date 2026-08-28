const {
  getOrderAvailabilitySettings,
  updateOrderAvailabilitySettings,
} = require('../models/orderAvailabilitySettingsModel');

const getOrderAvailabilitySettingsHandler = async (req, res, next) => {
  try {
    const settings = await getOrderAvailabilitySettings();
    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderAvailabilitySettingsHandler = async (req, res, next) => {
  try {
    const payload = req.body || {};
    const onlineOrdersEnabled = payload.onlineOrdersEnabled !== undefined ? payload.onlineOrdersEnabled : true;
    const listOrdersEnabled = payload.listOrdersEnabled !== undefined ? payload.listOrdersEnabled : true;

    const updated = await updateOrderAvailabilitySettings({
      onlineOrdersEnabled,
      listOrdersEnabled,
    });

    return res.status(200).json({
      success: true,
      message: 'Order availability settings updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrderAvailabilitySettingsHandler,
  updateOrderAvailabilitySettingsHandler,
};
