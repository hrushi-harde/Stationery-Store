import { useMemo, useState, useEffect } from 'react';
import ProductCard from './../Components/ProductCard';
import { useParams } from 'react-router-dom'; // 👈 import this
import './Shop.css';
import { getProducts, searchProducts } from '../services/api';

const Shop = () => {
  const { category: categoryParam } = useParams(); // 👈 Get category from URL
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [products, setProducts] = useState([]);
  const [aiResults, setAiResults] = useState([]);
  const [aiActive, setAiActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    if (categoryParam) {
      setCategory(categoryParam.toLowerCase());
    }
  }, [categoryParam]);

  useEffect(() => {
    let mounted = true;
    const loadProducts = async () => {
      setLoading(true);
      try {
        const response = await getProducts();
        if (mounted) setProducts(response.items || []);
      } catch (error) {
        if (mounted) setProducts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProducts();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSearch = (e) => setSearchTerm(e.target.value.toLowerCase());
  const handleCategory = (e) => setCategory(e.target.value);
  const handlePrice = (e) => setPriceRange(e.target.value);
  const handleSort = (e) => setSortBy(e.target.value);

  const normalizeCategory = (value) =>
    value.toLowerCase().replace(/\s+/g, '-');

  const categories = useMemo(() => {
    const set = new Map();
    products.forEach((product) => {
      if (product.category) set.set(normalizeCategory(product.category), product.category);
    });
    return Array.from(set.entries());
  }, [products]);

  const activeProducts = aiActive ? aiResults : products;

  const filteredData = useMemo(() => {
    const filtered = activeProducts.filter((product) => {
      const name = product.name || product.pname || '';
      const matchesSearch = aiActive || name.toLowerCase().includes(searchTerm);
      const matchesCategory =
        category === 'all' ||
        normalizeCategory(product.category || '') === normalizeCategory(category);
      const matchesPrice =
        priceRange === 'all' ||
        (priceRange === 'low' && product.offerPrice <= 100) ||
        (priceRange === 'medium' && product.offerPrice > 100 && product.offerPrice <= 500) ||
        (priceRange === 'high' && product.offerPrice > 500);

      return matchesSearch && matchesCategory && matchesPrice;
    });

    const sorted = [...filtered];
    if (sortBy === 'price_low') {
      sorted.sort((a, b) => a.offerPrice - b.offerPrice);
    } else if (sortBy === 'price_high') {
      sorted.sort((a, b) => b.offerPrice - a.offerPrice);
    } else if (sortBy === 'popularity') {
      sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }

    return sorted;
  }, [activeProducts, aiActive, category, priceRange, searchTerm, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const pagedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [category, priceRange, searchTerm, sortBy, aiActive]);

  const handleAiSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const response = await searchProducts(searchTerm, { mode: 'nlp' });
      setAiResults(response.items || []);
      setAiActive(true);
    } catch (error) {
      setAiResults([]);
      setAiActive(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAi = () => {
    setAiActive(false);
    setAiResults([]);
  };

  return (
    <div className="shop-container">
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleSearch}
        />

        <button className="ai-search-btn" onClick={handleAiSearch}>
          Smart Search
        </button>
        {aiActive && (
          <button className="ai-clear-btn" onClick={handleClearAi}>
            Clear AI
          </button>
        )}

        <select value={category} onChange={handleCategory}>
          <option value="all">All Categories</option>
          {categories.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select onChange={handlePrice}>
          <option value="all">All Prices</option>
          <option value="low">Under ₹100</option>
          <option value="medium">₹100 - ₹500</option>
          <option value="high">Above ₹500</option>
        </select>

        <select value={sortBy} onChange={handleSort}>
          <option value="featured">Featured</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
          <option value="popularity">Popularity</option>
        </select>
      </div>

      <div className="product-grid">
        {loading && <div className="loading-products">Loading products...</div>}
        {!loading && pagedData.map(product => (
          <ProductCard
            key={product.id}
            product={{
              id: product.id,
              pname: product.name,
              price: product.price,
              offer_price: product.offerPrice,
              description: product.description,
              pimage: product.image,
            }}
          />
        ))}
      </div>

      {!loading && filteredData.length === 0 && (
        <div className="empty-state">
          <h3>No products match your filters.</h3>
          <p>Try adjusting the search or filters to see more results.</p>
        </div>
      )}

      {!loading && filteredData.length > 0 && (
        <div className="pagination">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Shop;
