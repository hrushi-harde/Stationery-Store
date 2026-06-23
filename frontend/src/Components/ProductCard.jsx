import React from 'react';
import styles from './ProductCard.module.css';
import { Link } from 'react-router-dom';
import ShopNowButton from './ShopNowButton';

const ProductCard = ({ product }) => {
  const shortDescription = product.description.length > 30
    ? product.description.slice(0, 30) + '...'
    : product.description;

  return (
    <Link to={`/product/${product.id}`} className={styles.productLink}>
      <div className={styles.productCard}>
        <div className={styles.imageWrapper}>
          <img src={product.pimage} alt={product.pname} />
        </div>

        <h3>{product.pname}</h3>
        <p className={styles.description}>{shortDescription}</p>

        <div className={styles.priceSection}>
          {product.offer_price ? (
            <>
              <span className={styles.originalPrice}>₹{product.price}</span>
              <span className={styles.offerPrice}>₹{product.offer_price}</span>
            </>
          ) : (
            <span className={styles.offerPrice}>₹{product.price}</span>
          )}
        </div>
        
        <ShopNowButton />
      </div>
    </Link>
  );
};

export default ProductCard;
