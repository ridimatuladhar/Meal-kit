import React from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EmailVerify from "./pages/EmailVerify";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ResetPassword from "./pages/ResetPassword";
import Register from "./pages/Register";
import Menu from "./pages/Menu";
import AboutUs from "./pages/AboutUs";
import Dashboard from "./pages/Admin/Dashboard";
import Detail from "./pages/Detail";
import Settings from "./pages/Settings";
import Favourites from "./pages/Favourites";
import Users from "./pages/Admin/Users";
import Mealkits from "./pages/Admin/Mealkits";
import Cart from "./pages/Cart";
import AddMealkits from "./pages/Admin/AddMealkits";
import OrdersReceived from "./pages/Admin/OrdersReceived";
import Payments from "./pages/Admin/Payments";
import EditMealkit from "./pages/Admin/EditMealkit";
import ReviewAdmin from "./pages/Admin/ReviewAdmin";
import CheckOut from "./pages/CheckOut";
import Terms from "./pages/Terms";
import OrderConfirmation from "./pages/OrderConfirmation";
import PaymentVerification from "./pages/PaymentVerfication";
import MyOrders from "./pages/MyOrders";

const App = () => {
  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar style={{ top: '4rem', right: '1rem' }} />
      
      <Routes>
        <Route exact path="/" element={<Home />} />
        <Route exact path="/login" element={<Login />} />
        <Route exact path="/register" element={<Register />} />
        <Route exact path="/email-verify" element={<EmailVerify />} />
        <Route exact path="/reset-password" element={<ResetPassword />} />
        <Route exact path="/menu" element={<Menu />} />
        <Route exact path="/about-us" element={<AboutUs />} />
        <Route exact path="/detail" element={<Detail />} />
        <Route exact path="/cart" element={<Cart />} />
        <Route exact path="/checkout" element={<CheckOut />} />
        <Route exact path="/terms" element={<Terms />} />
        <Route exact path="/order-confirmation" element={<OrderConfirmation />} />
        <Route exact path="/profile/settings" element={<Settings />} />
        <Route exact path="/profile/favourite" element={<Favourites />} />
        <Route exact path="/profile/orders" element={<MyOrders />} />
        <Route path="/payment/verify" element={<PaymentVerification />} />

        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/mealkits" element={<Mealkits />} />
        <Route path="/admin/mealkits/add" element={<AddMealkits />} />
        <Route path="/admin/mealkits/edit/:id" element={<EditMealkit />} />
        <Route path="/admin/orders" element={<OrdersReceived />} />
        <Route path="/admin/reviews" element={<ReviewAdmin />} />
        <Route path="/admin/payments" element={<Payments />} />
      </Routes>
    </div>
  );
};

export default App;
