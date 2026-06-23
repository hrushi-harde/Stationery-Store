import { useSelector, useDispatch } from "react-redux";
import { remove, increaseQuantity, decreaseQuantity } from "../redux/Slices/CartSlice";
import { Link } from "react-router-dom";
import { MdDelete } from "react-icons/md";
import { toast } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css";
import "./Cart.css";

const CartPage = () => {
  const cartItems = useSelector((state) => state.cart);
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const isOwner = user?.role === "owner";

  if (isOwner) {
    return (
      <div className="cart-container">
        <h1>Owner Access</h1>
        <p className="empty-cart">
          Purchasing is disabled for owner accounts. You can manage products from <Link to="/owner">Owner Panel</Link>.
        </p>
      </div>
    );
  }

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.offer_price * item.quantity,
    0
  );

   const handleRemove = (id) => {
    dispatch(remove(id));
    toast.error("❌ Removed from cart");
  };

  return (
    <div className="cart-container">
      <h1>🛒 Your Cart</h1>

      {cartItems.length === 0 ? (
        <p className="empty-cart">
          Your cart is empty. <Link to="/shop/all">Go to Shop</Link>
        </p>
      ) : (
        <>
          <div className="cart-list">
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <img src={item.pimage} alt={item.pname} />
                <div className="item-info">
                  <h2>{item.pname}</h2>
                  <p className="item-desc">{item.description}</p>

                  <div className="quantity-block">
                    <div className="counter"> Quantity : 
                      <button
                        className="counter-btn"
                        onClick={() => dispatch(decreaseQuantity(item.id) )}
                      >
                        –
                      </button>
                      <span className="counter-value">{item.quantity}</span>
                      <button
                        className="counter-btn"
                        onClick={() => dispatch(increaseQuantity(item.id))}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <p><strong>Price:</strong> ₹{item.offer_price}</p>
                  <p><strong>Total:</strong> ₹{item.offer_price * item.quantity}</p>

                </div>
                <div>
                <button className="delete-btn"
                onClick={() => handleRemove(item.id)}>
                <MdDelete  size={24}></MdDelete>
                </button>
                </div>

              </div>
            ))}
          </div>

           <div className="cart-summary">
  <h3 className="summary-title">🧾 Order Summary</h3>
  <div className="summary-card">
    <div className="summary-details">
      <div className="summary-row">
        <span>🛍 Items in Cart</span>
        <span>{cartItems.length}</span>
      </div>
      <div className="summary-row">
        <span>💰 Subtotal</span>
        <span>₹{totalPrice.toFixed(2)}</span>
      </div>
      <div className="summary-row">
        <span>🚚 Shipping</span>
        <span className="free-ship">Free</span>
      </div>
      <hr />
      <div className="summary-row total-row">
        <strong>Total</strong>
        <strong>₹{totalPrice.toFixed(2)}</strong>
      </div>
    </div>

    <Link to="/order-summary" className="checkout-link">
      <button className="checkout-btn">
        🧾 Proceed to Checkout
      </button>
    </Link>
  </div>
</div>

        </>
      )}
    </div>
  );
};

export default CartPage;
