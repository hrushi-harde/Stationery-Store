import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import "./OrderSummary.css";

const OrderSummary = () => {
  const cartItems = useSelector((state) => state.cart);
  const user = useSelector((state) => state.auth.user);
  const isOwner = user?.role === "owner";

  if (isOwner) {
    return (
      <div className="order-summary">
        <h1>Owner Access</h1>
        <p className="empty-state">
          Purchasing is disabled for owner accounts. Use <Link to="/owner">Owner Panel</Link> to manage products.
        </p>
      </div>
    );
  }

  const subtotal = cartItems.reduce(
    (total, item) => total + item.offer_price * item.quantity,
    0
  );

  return (
    <div className="order-summary">
      <h1>Order Summary</h1>

      {cartItems.length === 0 ? (
        <p className="empty-state">Your cart is empty. Add items to continue.</p>
      ) : (
        <div className="summary-grid">
          <div className="summary-items">
            {cartItems.map((item) => (
              <div key={item.id} className="summary-item">
                <img src={item.pimage} alt={item.pname} />
                <div>
                  <h3>{item.pname}</h3>
                  <p>Qty: {item.quantity}</p>
                  <p>₹{item.offer_price * item.quantity}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="summary-card">
            <h2>Price Details</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span className="free">Free</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <Link to="/checkout" className="primary-btn">
              Continue to Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSummary;
