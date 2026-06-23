import React from "react";
import { Link } from "react-router-dom";
import "./HomeCard.css";
import ShopNowButton from "./ShopNowButton.jsx";

function HomeCard({ products }) {
  
  return (
    <div className="card">
      <div className="image-container">
        <img src={products.pimage} alt={products.title} className="image" />
        {products.badge && (
          <span className={`badge ${products.badge.toLowerCase()}`}>
            {products.badge}
          </span>
        )}
      </div>
      <h3>{products.title}</h3>
      <div className="button">
        <Link to={`/shop/${products.category}`}>
          <ShopNowButton />
        </Link>
      </div>
    </div>
  );
}

export default HomeCard;
