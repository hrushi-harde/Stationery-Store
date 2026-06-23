import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { clearCart } from "../redux/Slices/CartSlice";
import { createOrder } from "../services/api";
import { loadFromStorage, saveToStorage } from "../services/storage";
import "./Checkout.css";

const Checkout = () => {
  const cartItems = useSelector((state) => state.cart);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + item.offer_price * item.quantity,
        0
      ),
    [cartItems]
  );

  const isOwner = user?.role === "owner";

  if (isOwner) {
    return (
      <div className="checkout">
        <h1>Owner Access</h1>
        <p>
          Purchasing is disabled for owner accounts. Go to <Link to="/owner">Owner Panel</Link>.
        </p>
      </div>
    );
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (cartItems.length === 0) return;

    setSubmitting(true);
    try {
      const payload = {
        customer: form,
        items: cartItems,
        totals: { subtotal, shipping: 0, total: subtotal },
      };
      const order = await createOrder(payload);

      const existing = loadFromStorage("stationery_orders", []);
      saveToStorage("stationery_orders", [
        {
          id: order.id,
          createdAt: new Date().toISOString(),
          status: order.status || "created",
          ...payload,
        },
        ...existing,
      ]);

      dispatch(clearCart());
      navigate("/order-success", { state: { orderId: order.id } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="checkout">
      <h1>Checkout</h1>
      <div className="checkout-grid">
        <form className="checkout-form" onSubmit={handleSubmit}>
          <h2>Shipping Details</h2>
          <div className="form-row">
            <input
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-row">
            <input
              name="phone"
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange}
              required
            />
            <input
              name="city"
              placeholder="City"
              value={form.city}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-row">
            <input
              name="state"
              placeholder="State"
              value={form.state}
              onChange={handleChange}
              required
            />
            <input
              name="zip"
              placeholder="ZIP Code"
              value={form.zip}
              onChange={handleChange}
              required
            />
          </div>
          <textarea
            name="address"
            placeholder="Street Address"
            value={form.address}
            onChange={handleChange}
            rows={4}
            required
          />
          <button type="submit" disabled={submitting}>
            {submitting ? "Placing Order..." : "Place Order"}
          </button>
        </form>

        <div className="checkout-summary">
          <h2>Order Total</h2>
          <div className="summary-row">
            <span>Items</span>
            <span>{cartItems.length}</span>
          </div>
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
        </div>
      </div>
    </div>
  );
};

export default Checkout;
