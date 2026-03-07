const { restaurantRepository } = require('../repositories');
const { NotFoundError } = require('../utils/errors');

class RestaurantService {
  static async getAllRestaurants() {
    return restaurantRepository.findAll();
  }

  static async getRestaurantById(id) {
    const restaurant = await restaurantRepository.findById(id);
    if (!restaurant) {
      throw new NotFoundError('Restaurant');
    }
    return restaurant;
  }

  static async getRestaurantByUserId(userId) {
    const restaurant = await restaurantRepository.findByUserId(userId);
    if (!restaurant) {
      throw new NotFoundError('Restaurant');
    }
    return restaurant;
  }

  static async getMyStats(userId) {
    const restaurant = await restaurantRepository.findByUserIdWithStats(userId);
    if (!restaurant) {
      throw new NotFoundError('Restaurant');
    }

    const needs = restaurant.needs || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const open = needs.filter(n => n.status === 'OPEN').length;
    const funded = needs.filter(n => n.status === 'FUNDED').length;
    const confirmed = needs.filter(n => n.status === 'CONFIRMED').length;
    const totalServed = confirmed;
    const confirmedNeeds = needs.filter(n => n.status === 'CONFIRMED');
    const totalAmount = confirmedNeeds
      .reduce((sum, n) => sum + parseFloat(n.estimatedAmount || 0), 0);
    const todayOrders = needs.filter(order => {
      const orderDate = order.lockedAt || order.createdAt;
      return orderDate && new Date(orderDate) >= today;
    }).length;

    // Average order value
    const avgOrderValue = confirmedNeeds.length > 0
      ? Math.round(totalAmount / confirmedNeeds.length)
      : 0;

    // Computed rating: base 4.0 + up to 1.0 based on confirmed orders (every 5 = +0.1, capped)
    const ratingBonus = Math.min(1.0, Math.floor(totalServed / 5) * 0.1);
    const avgRating = totalServed > 0 ? (4.0 + ratingBonus).toFixed(1) : null;

    // Weekly performance data (last 7 days): all active statuses
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = dayNames.map(() => ({ count: 0, amount: 0 }));
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    needs.forEach(need => {
      const date = new Date(need.lockedAt || need.createdAt);
      if (date >= oneWeekAgo) {
        const dayIdx = date.getDay();
        weeklyData[dayIdx].count++;
        weeklyData[dayIdx].amount += parseFloat(need.estimatedAmount || 0);
      }
    });

    return {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        neighborhood: restaurant.neighborhood,
        createdAt: restaurant.createdAt,
      },
      stats: {
        open,
        funded,
        confirmed,
        totalServed,
        totalAmount,
        todayOrders,
        totalOrders: needs.length,
        avgOrderValue,
        avgRating,
        weeklyData,
        weeklyDays: dayNames,
      },
    };
  }
}

module.exports = new RestaurantService();
