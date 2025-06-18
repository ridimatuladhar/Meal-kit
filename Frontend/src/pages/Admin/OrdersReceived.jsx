import React, { useState, useEffect } from 'react';
import AdminNav from '../../components/AdminNav';
import { toast } from 'react-toastify';

const OrdersReceived = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortOption, setSortOption] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ordersPerPage = 10;

  useEffect(() => {
    fetchOrders();
  }, [filter, paymentFilter, sortOption, currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Fixed filter parameters - use empty string for 'all'
      const filterParam = filter === 'all' ? '' : filter;
      const paymentFilterParam = paymentFilter === 'all' ? '' : paymentFilter;
      
      // Build the URL with all parameters
      let url = `http://localhost:3000/api/order/admin/all?page=${currentPage}&limit=${ordersPerPage}&sort=${sortOption}`;
      
      // Add status filter if present
      if (filterParam) {
        url += `&status=${filterParam}`;
      }
      
      // Add payment status filter if present
      if (paymentFilterParam) {
        url += `&paymentStatus=${paymentFilterParam}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
      }

      setOrders(data.orders);
      setTotalPages(data.pagination.pages || 1);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders. Please try again.');
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/order/admin/${orderId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            status: newStatus,
            note: `Status updated to ${newStatus} by admin`,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update order status');
      }

      toast.success(`Order status updated to ${newStatus}`);
      
      // Update order in the state
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.message || 'Failed to update order status');
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      pending: 'bg-gray-200 text-gray-800',
      confirmed: 'bg-gray-300 text-gray-800',
      preparing: 'bg-gray-400 text-white',
      out_for_delivery: 'bg-gray-500 text-white',
      delivered: 'bg-black text-white',
      cancelled: 'bg-gray-700 text-white',
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusBadgeClass = (status) => {
    const paymentStatusClasses = {
      pending: 'bg-gray-200 text-gray-800',
      completed: 'bg-black text-white',
      refunded: 'bg-gray-500 text-white',
      failed: 'bg-gray-700 text-white',
    };
    return paymentStatusClasses[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return statusLabels[status] || status;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAddress = (shippingDetails) => {
    if (!shippingDetails) return 'N/A';
    return `${shippingDetails.name}, ${shippingDetails.address}, ${shippingDetails.phoneNumber}`;
  };

  const renderPagination = () => {
    return (
      <div className="flex justify-center mt-6">
        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
              currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          
          {[...Array(totalPages).keys()].map(page => (
            <button
              key={page + 1}
              onClick={() => setCurrentPage(page + 1)}
              className={`relative inline-flex items-center px-4 py-2 border ${
                currentPage === page + 1
                  ? 'z-10 bg-black border-black text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              } text-sm font-medium`}
            >
              {page + 1}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
              currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Next
          </button>
        </nav>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="flex-1 ml-40 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Orders Management</h1>
          <p className="text-gray-600 border-b border-gray-200 pb-4">View and manage all customer orders</p>
        </div>

        {/* Filters and sorting */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Filter by Order Status:</label>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black text-sm py-2 px-2"
              >
                <option value="all">All Orders</option>
                <option value="ongoing">Ongoing Orders</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Sort by:</label>
              <select
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black text-sm py-2 px-2"
              >
                <option value="latest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Price: High to Low</option>
                <option value="lowest">Price: Low to High</option>
              </select>
            </div>

            <div className="flex justify-start">
              <button
                onClick={() => {
                  setCurrentPage(1); // Reset to first page when manually refreshing
                  fetchOrders();
                }}
                className="bg-black text-white px-6 py-2 rounded-md text-sm hover:bg-gray-800 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Orders table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-black"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-10 text-center">
            <svg className="w-20 h-20 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            <h3 className="mt-5 text-xl font-medium text-gray-900">No orders found</h3>
            <p className="mt-2 text-gray-600">There are no orders matching your current filters.</p>
            <button
              onClick={() => {
                setFilter('all');
                setPaymentFilter('all');
                setSortOption('latest');
                setCurrentPage(1);
                fetchOrders(); 
              }}
              className="mt-6 px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Order Details</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Customer</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Date & Price</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Payment</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Order Status</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-2">
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </div>
                      </td>

                      <td className="px-6 py-2">
                        <div className="text-sm font-medium text-gray-900">{order.user?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">{formatAddress(order.shippingDetails)}</div>
                      </td>

                      <td className="px-6 py-2">
                        <div className="text-sm text-gray-700">{formatDate(order.createdAt)}</div>
                        <div className="text-sm font-medium text-gray-900 mt-1">Rs. {order.totalAmount}</div>
                      </td>

                      <td className="px-6 py-2">
                        <div className="text-sm font-medium capitalize">{order.paymentMethod}</div>
                        <div className={`text-xs inline-block px-2 py-1 rounded-full mt-1 ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </div>
                      </td>

                      <td className="px-6 py-2">
                        <span className={`px-3 py-1.5 inline-flex text-xs font-medium rounded-full ${getStatusBadgeClass(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>

                      <td className="px-6 py-2">
                        <div className="flex flex-col gap-3">
                          <select
                            className="block w-full px-2 rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black text-sm"
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                            disabled={order.status === 'cancelled' || order.status === 'delivered'}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Preparing</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          
                        
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && orders.length > 0 && renderPagination()}
      </div>
    </div>
  );
};

export default OrdersReceived;