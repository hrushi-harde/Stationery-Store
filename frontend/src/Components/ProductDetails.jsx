import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { add, remove } from "../redux/Slices/CartSlice";
import { getProductById } from "../services/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ProductDetails.css";
import ContactCard from "./ContactCard";
import Recommendations from "./Recommendations";

const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [product, setProduct] = useState(null);

  const cartItems = useSelector((state) => state.cart);
  const user = useSelector((state) => state.auth.user);
  const isOwner = user?.role === "owner";

  useEffect(() => {
    let mounted = true;
    const loadProduct = async () => {
      try {
        const response = await getProductById(id);
        if (!response) {
          setProduct(null);
          return;
        }

        if (response.pname) {
          if (mounted) setProduct(response);
          return;
        }

        const normalized = {
          id: response.id,
          pname: response.name,
          price: response.price,
          offer_price: response.offerPrice,
          category: response.category,
          description: response.description,
          is_active: response.isActive ? 1 : 0,
          pimage: response.image,
        };

        if (mounted) setProduct(normalized);
      } catch (error) {
        if (mounted) setProduct(null);
      }
    };

    loadProduct();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (!product) return <p className="not-found">❌ Product not found.</p>;

  const isInCart = cartItems.find((item) => item.id === product.id);

  const handleAddToCart = () => {
    dispatch(add({ ...product }));
    toast.success("🛒 Added to cart!");
  };

  const handleRemoveFromCart = () => {
    dispatch(remove(product.id));
    toast.error("❌ Removed from cart");
  };

  return (
    <>
      <div className="product-details-wrapper">
        <div className="product-detail-card">
          <div className="image-section">
            <img
              src={product.pimage}
              alt={product.pname}
              className="product-image"
            />
          </div>

          <div className="info-section">
            <h1>{product.pname}</h1>
            <p className="description">{product.description}</p>

            <div className="product-meta">
              <p>
                <strong>Category :</strong> {product.category}
              </p>
              <p>
                <strong>Availability : </strong>{" "}
                {product.is_active === 1 ? "Available" : "Not Available"}
              </p>
              <p>
                <strong>Delivery: </strong> Within 3–5 business days
              </p>
            </div>

            <div className="price-details-enhanced">
              <div className="price-main">
                <span className="offer-price">₹{product.offer_price}</span>
                <span className="original-price">₹{product.price}</span>
              </div>
              <div className="price-meta">
                <span className="discount-badge">
                  {Math.round(
                    ((product.price - product.offer_price) / product.price) *
                      100
                  )}
                  % OFF
                </span>
                <span className="you-save">
                  You Save ₹{product.price - product.offer_price}
                </span>
              </div>
            </div>

            <div className="Button">
              {isOwner ? (
                <p className="owner-message">Owner accounts can manage catalog visibility but cannot purchase products.</p>
              ) : (
                <>
                  {isInCart ? (
                    <button
                      onClick={handleRemoveFromCart}
                      className="cart-btn"
                      id="remove-cart"
                    >
                      ❌ Remove from Cart
                    </button>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      className="cart-btn"
                      id="add-cart"
                    >
                      🛒 Add to Cart
                    </button>
                  )}

                  <Link to="/cart" className="link-wrapper">
                    <button className="cart-btn">View Cart</button>
                  </Link>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
      <Recommendations productId={product.id} />
      {!isOwner && <ContactCard />}
    </>
  );
};

export default ProductDetails;
