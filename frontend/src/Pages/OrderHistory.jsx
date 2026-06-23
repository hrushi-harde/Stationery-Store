import { loadFromStorage } from "../services/storage";
import "./OrderHistory.css";

const OrderHistory = () => {
  const orders = loadFromStorage("stationery_orders", []);

  return (
    <div className="orders">
      <h1>Order History</h1>
      {orders.length === 0 ? (
        <p className="empty">No orders yet. Place your first order today!</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div>
                <h3>Order {order.id}</h3>
                <p>Status: {order.status}</p>
                <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="order-total">₹{order.totals.total.toFixed(2)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
