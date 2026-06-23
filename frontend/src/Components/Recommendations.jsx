import { useEffect, useState } from "react";
import { getRecommendations } from "../services/api";
import ProductCard from "./ProductCard";
import "./Recommendations.css";

const Recommendations = ({ productId }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    const loadRecommendations = async () => {
      try {
        const response = await getRecommendations(productId);
        if (mounted) setItems(response.items || response || []);
      } catch (error) {
        if (mounted) setItems([]);
      }
    };

    if (productId) loadRecommendations();
    return () => {
      mounted = false;
    };
  }, [productId]);

  if (!items.length) return null;

  return (
    <section className="recommendations">
      <h2>Similar Products</h2>
      <div className="recommendations-grid">
        {items.map((item) => (
          <ProductCard
            key={item.id}
            product={{
              id: item.id,
              pname: item.name,
              price: item.price,
              offer_price: item.offerPrice,
              description: item.description,
              pimage: item.image,
            }}
          />
        ))}
      </div>
    </section>
  );
};

export default Recommendations;
