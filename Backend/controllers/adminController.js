import { Order }  from '../models/orderModel.js';
import User from '../models/userModel.js';
import { MealKit}  from '../models/mealKitModel.js';
import moment from 'moment';

export const countUsers = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        
        res.status(200).json({
            success: true,
            userCount
        });
    } catch (error) {
        console.error('Error counting users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to count users'
        });
    }
};

export const countMealKits = async (req, res) => {
    try {
        const mealKitCount = await MealKit.countDocuments();
        
        res.status(200).json({
            success: true,
            mealKitCount
        });
    } catch (error) {
        console.error('Error counting meal kits:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to count meal kits'
        });
    }
};

export const countCompletedOrders = async (req, res) => {
    try {
        const completedOrdersCount = await Order.countDocuments({ status: 'delivered' });
        
        res.status(200).json({
            success: true,
            completedOrdersCount
        });
    } catch (error) {
        console.error('Error counting completed orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to count completed orders'
        });
    }
};

export const getOrderStats = async (req, res) => {
    try {
        const { timeRange } = req.query;
        let stats = [];
        let startDate, endDate, format, dateField;

        // Set time parameters based on selected range
        switch (timeRange) {
            case 'weekly':
                // Last 7 days
                startDate = moment().subtract(6, 'days').startOf('day');
                endDate = moment().endOf('day');
                format = 'ddd'; // Day of week (e.g., Mon, Tue)
                dateField = 'day';
                break;
            case 'monthly':
                // Current month, day by day
                startDate = moment().startOf('month');
                endDate = moment().endOf('day');
                format = 'MMM D'; // Month and day (e.g., Apr 15)
                dateField = 'day';
                break;
            case 'yearly':
                // Last 12 months
                startDate = moment().subtract(11, 'months').startOf('month');
                endDate = moment().endOf('month');
                format = 'MMM YYYY'; // Month and year (e.g., Apr 2023)
                dateField = 'month';
                break;
            default:
                // Default to weekly
                startDate = moment().subtract(6, 'days').startOf('day');
                endDate = moment().endOf('day');
                format = 'ddd';
                dateField = 'day';
        }

        // Query for orders within the time range
        const orders = await Order.find({
            createdAt: {
                $gte: startDate.toDate(),
                $lte: endDate.toDate()
            }
        });

        // Process and group the orders
        if (timeRange === 'weekly' || (timeRange === 'monthly' && moment().diff(startDate, 'days') <= 31)) {
            // For weekly or monthly (if less than 31 days), show each day
            let currentDate = moment(startDate);
            
            while (currentDate.isSameOrBefore(endDate, 'day')) {
                const dayStart = moment(currentDate).startOf('day');
                const dayEnd = moment(currentDate).endOf('day');
                
                // Filter orders for this day
                const dayOrders = orders.filter(order => 
                    moment(order.createdAt).isBetween(dayStart, dayEnd, undefined, '[]')
                );
                
                // Group by status
                const statusCounts = {
                    pending: dayOrders.filter(o => o.status === 'pending').length,
                    confirmed: dayOrders.filter(o => o.status === 'confirmed').length,
                    preparing: dayOrders.filter(o => o.status === 'preparing').length,
                    out_for_delivery: dayOrders.filter(o => o.status === 'out_for_delivery').length,
                    delivered: dayOrders.filter(o => o.status === 'delivered').length,
                    cancelled: dayOrders.filter(o => o.status === 'cancelled').length
                };
                
                stats.push({
                    period: currentDate.format(format),
                    orders: dayOrders.length,
                    revenue: dayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
                    statusCounts
                });
                
                // Move to next day
                currentDate.add(1, 'day');
            }
        } else if (timeRange === 'yearly' || timeRange === 'monthly') {
            // For yearly, group by months
            let currentDate = moment(startDate);
            
            while (currentDate.isSameOrBefore(endDate, 'month')) {
                const monthStart = moment(currentDate).startOf('month');
                const monthEnd = moment(currentDate).endOf('month');
                
                // Filter orders for this month
                const monthOrders = orders.filter(order => 
                    moment(order.createdAt).isBetween(monthStart, monthEnd, undefined, '[]')
                );
                
                // Group by status
                const statusCounts = {
                    pending: monthOrders.filter(o => o.status === 'pending').length,
                    confirmed: monthOrders.filter(o => o.status === 'confirmed').length,
                    preparing: monthOrders.filter(o => o.status === 'preparing').length,
                    out_for_delivery: monthOrders.filter(o => o.status === 'out_for_delivery').length,
                    delivered: monthOrders.filter(o => o.status === 'delivered').length,
                    cancelled: monthOrders.filter(o => o.status === 'cancelled').length
                };
                
                stats.push({
                    period: currentDate.format(format),
                    orders: monthOrders.length,
                    revenue: monthOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
                    statusCounts
                });
                
                // Move to next month
                currentDate.add(1, 'month');
            }
        }

        res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error getting order stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get order statistics'
        });
    }
};