import React from "react";
import HomeCard from "../Components/HomeCard";
import NewProductSlider from '../Components/NewProductSlider'
import {ProductCategory} from '../Data/ProductData'
import "./Home.css";
import { NavLink } from 'react-router-dom';




const HomePage = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Premium Stationery Kits for Work & School — Delivered Fast!</h1>
          <p>Your one-stop shop for quality notebooks, pens, and planners.</p>
          <NavLink to="/shop/all"><button className="cta-button">Shop Now</button></NavLink>
        </div>
        <img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80"
          alt="Stationery Banner"
          className="hero-image"
        />
      </section>

      {/* Product Categories Section */}
      <section className="categories-section">
        <h2 className="sectionHeading">Shop By Category</h2>
        <div className="categories-grid">
          {ProductCategory.map((category, index) => (
            <HomeCard products={category} key={index} />
          ))}
        </div>
      </section>

      <NewProductSlider></NewProductSlider>

      {/* Our Partners Section */}
      <section className="partners-section">
        <h2>Our Trusted Partners</h2>
        <div className="partners-logos">
          <img src="Patners/camlin.jpg" alt="camlin" />
          <img src="Patners/sundram.jpg" alt="sundram" />
          <img src="Patners/navneet.jpg" alt="navneet" />
          <img src="Patners/renolds.jpg" alt="renolds" />
          <img src="Patners/classmate.jpeg" alt="classmate" />
          <img src="Patners/Doms.png" alt="Doms" />
        </div>
      </section>
    </div>
  );
};

export default HomePage;
