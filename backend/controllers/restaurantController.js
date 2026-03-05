const { restaurantService } = require('../services');
const { asyncHandler } = require('../utils');

const getAllRestaurants = asyncHandler(async (req, res) => {
  const restaurants = await restaurantService.getAllRestaurants();
  res.json({
    success: true,
    data: restaurants,
  });
});

const getMyRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await restaurantService.getRestaurantByUserId(req.user.id);
  res.json({
    success: true,
    data: restaurant,
  });
});

const getMyStats = asyncHandler(async (req, res) => {
  const result = await restaurantService.getMyStats(req.user.id);
  res.json({
    success: true,
    data: result,
  });
});

module.exports = { getAllRestaurants, getMyRestaurant, getMyStats };
