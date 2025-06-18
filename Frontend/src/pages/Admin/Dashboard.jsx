import React, { useEffect, useState } from 'react';
import AdminNav from '../../components/AdminNav';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Dashboard = () => {
  const [userCount, setUserCount] = useState(0);
  const [mealKitCount, setMealKitCount] = useState(0);
  const [completedOrdersCount, setCompletedOrdersCount] = useState(0);
  const [orderStats, setOrderStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('weekly'); // 'weekly', 'monthly', 'yearly'

  // Fetch counts on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Add withCredentials: true to all your axios requests
        const [usersResponse, mealKitsResponse, ordersResponse, statsResponse] = await Promise.all([
          axios.get('http://localhost:3000/api/admin/count-users', { withCredentials: true }),
          axios.get('http://localhost:3000/api/admin/count-meal-kits', { withCredentials: true }),
          axios.get('http://localhost:3000/api/admin/count-completed-orders', { withCredentials: true }),
          axios.get(`http://localhost:3000/api/admin/order-stats?timeRange=${timeRange}`, { withCredentials: true })
        ]);

        // Check if all responses are successful
        if (usersResponse.data.success &&
          mealKitsResponse.data.success &&
          ordersResponse.data.success &&
          statsResponse.data.success) {

          setUserCount(usersResponse.data.userCount);
          setMealKitCount(mealKitsResponse.data.mealKitCount);
          setCompletedOrdersCount(ordersResponse.data.completedOrdersCount);
          setOrderStats(statsResponse.data.stats);
        } else {
          setError('Invalid response format.');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <AdminNav />
        <div className="flex-1 ml-60 p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <AdminNav />
        <div className="flex-1 ml-60 p-6 flex items-center justify-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar (AdminNav) */}
      <AdminNav />

      {/* Main Content */}
      <div className="flex-1 ml-40 p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Users Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 mr-4">
              <i className="fa-solid fa-user"></i>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">Total Users</h2>
                <p className="text-2xl font-bold text-gray-900">{userCount}</p>
              </div>
            </div>
          </div>

          {/* Total Meal Kits Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 mr-4">
              <i className="fa-solid fa-box"></i>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">Total Meal Kits</h2>
                <p className="text-2xl font-bold text-gray-900">{mealKitCount}</p>
              </div>
            </div>
          </div>

          {/* Completed Orders Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 mr-4">
              <i className="fa-solid fa-circle-check"></i>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-500">Completed Orders</h2>
                <p className="text-2xl font-bold text-gray-900">{completedOrdersCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Trends Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Order Trends</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => handleTimeRangeChange('weekly')}
                className={`px-3 py-1 rounded text-sm ${timeRange === 'weekly'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                Weekly
              </button>
              <button
                onClick={() => handleTimeRangeChange('monthly')}
                className={`px-3 py-1 rounded text-sm ${timeRange === 'monthly'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => handleTimeRangeChange('yearly')}
                className={`px-3 py-1 rounded text-sm ${timeRange === 'yearly'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                Yearly
              </button>
            </div>
          </div>

          {orderStats.length === 0 ? (
            <div className="flex justify-center items-center h-64 bg-gray-50 rounded">
              <p className="text-gray-500">No order data available for the selected time range</p>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={orderStats}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip formatter={(value, name) => {
                    if (name === 'revenue') return formatCurrency(value);
                    return value;
                  }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#8884d8" name="Orders" activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Orders by Status Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Orders by Status</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { status: 'Pending', count: orderStats.reduce((sum, item) => sum + (item.statusCounts?.pending || 0), 0) },
                    { status: 'Confirmed', count: orderStats.reduce((sum, item) => sum + (item.statusCounts?.confirmed || 0), 0) },
                    { status: 'Preparing', count: orderStats.reduce((sum, item) => sum + (item.statusCounts?.preparing || 0), 0) },
                    { status: 'Out for Delivery', count: orderStats.reduce((sum, item) => sum + (item.statusCounts?.out_for_delivery || 0), 0) },
                    { status: 'Delivered', count: orderStats.reduce((sum, item) => sum + (item.statusCounts?.delivered || 0), 0) },
                    { status: 'Cancelled', count: orderStats.reduce((sum, item) => sum + (item.statusCounts?.cancelled || 0), 0) }
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Latest Activity</h2>
            {/* This could be a list of recent orders or user registrations */}
            <div className="space-y-4">
              {orderStats.slice(0, 5).map((stat, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <i className="fa-solid fa-boxes-packing"></i>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{stat.period}: {stat.orders} orders</p>
                    <p className="text-xs text-gray-500">Revenue: {formatCurrency(stat.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;