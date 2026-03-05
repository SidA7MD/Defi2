const { needService } = require('../services');
const { asyncHandler } = require('../utils');

const createNeed = asyncHandler(async (req, res) => {
  const need = await needService.createNeed(req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: 'Need created successfully',
    data: need,
  });
});

const getNeeds = asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
    neighborhood: req.query.neighborhood,
    type: req.query.type,
  };
  const needs = await needService.getNeeds(filters);
  res.json({
    success: true,
    data: needs,
    count: needs.length,
  });
});

const getNeedById = asyncHandler(async (req, res) => {
  const need = await needService.getNeedById(req.params.id);
  res.json({
    success: true,
    data: need,
  });
});

const updateNeedStatus = asyncHandler(async (req, res) => {
  const need = await needService.updateNeedStatus(
    req.params.id,
    req.body.status,
    req.user.id
  );
  res.json({
    success: true,
    message: 'Need status updated',
    data: need,
  });
});

const getValidatorNeeds = asyncHandler(async (req, res) => {
  const needs = await needService.getValidatorNeeds(req.user.id);
  res.json({
    success: true,
    data: needs,
    count: needs.length,
  });
});

const getValidatorStats = asyncHandler(async (req, res) => {
  const result = await needService.getValidatorStats(req.user.id);
  res.json({
    success: true,
    data: result,
  });
});

const getRestaurantNeeds = asyncHandler(async (req, res) => {
  const { restaurantService } = require('../services');
  const restaurant = await restaurantService.getRestaurantByUserId(req.user.id);
  const needs = await needService.getRestaurantNeeds(restaurant.id);
  res.json({
    success: true,
    data: needs,
    count: needs.length,
  });
});

const confirmByRestaurant = asyncHandler(async (req, res) => {
  const { restaurantService } = require('../services');
  const restaurant = await restaurantService.getRestaurantByUserId(req.user.id);
  const need = await needService.confirmByRestaurant(
    req.params.id,
    restaurant.id,
    req.body.message
  );
  res.json({
    success: true,
    message: 'Meal confirmed successfully',
    data: need,
  });
});

module.exports = {
  createNeed,
  getNeeds,
  getNeedById,
  updateNeedStatus,
  getValidatorNeeds,
  getValidatorStats,
  getRestaurantNeeds,
  confirmByRestaurant,
};
