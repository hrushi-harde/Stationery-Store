import { useLocation, Link } from "react-router-dom";
import "./OrderSuccess.css";

const OrderSuccess = () => {
  const location = useLocation();
  const orderId = location.state?.orderId || "new-order";

  return (
    <div className="order-success">
      <div className="success-card">
        <h1>Order Placed!</h1>
        <p>Your order has been placed successfully.</p>
        <p className="order-id">Order ID: {orderId}</p>
        <div className="success-actions">
          <Link to="/orders">View Order History</Link>
          <Link to="/shop/all">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
