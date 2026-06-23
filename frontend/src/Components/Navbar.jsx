import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiBell, FiMenu, FiX, FiShoppingCart } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/Slices/AuthSlice';
import { getContactRequests, logoutUser } from '../services/api';
import { removeFromStorage } from '../services/storage';
import './Navbar.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const cartItems = useSelector((state) => state.cart);
  const { user, accessToken } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const profileInitial = (user?.name || user?.email || "U").trim().charAt(0).toUpperCase();
  const isOwner = user?.role === "owner";
  const ownerSeenKey = useMemo(() => {
    const ownerId = user?.email || user?.id || 'owner';
    return `stationery-store-owner-queries-seen-${ownerId}`;
  }, [user?.email, user?.id]);
  const [queryCount, setQueryCount] = useState(0);
  const [seenCount, setSeenCount] = useState(0);

  useEffect(() => {
    if (!isOwner) return undefined;

    let mounted = true;
    const loadQueryCount = async () => {
      try {
        const payload = await getContactRequests(accessToken);
        const total = Number(payload?.total || payload?.items?.length || 0);
        if (mounted) setQueryCount(total);
      } catch {
        if (mounted) setQueryCount(0);
      }
    };

    loadQueryCount();
    const timer = window.setInterval(loadQueryCount, 15000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [isOwner, accessToken]);

  useEffect(() => {
    if (!isOwner || typeof window === 'undefined') return;

    try {
      const storedSeen = Number(window.localStorage.getItem(ownerSeenKey) || 0);
      setSeenCount(Number.isFinite(storedSeen) ? storedSeen : 0);
    } catch {
      setSeenCount(0);
    }
  }, [isOwner, ownerSeenKey]);

  const unreadQueryCount = Math.max(queryCount - seenCount, 0);

  const markQueriesAsSeen = () => {
    if (!isOwner || typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(ownerSeenKey, String(queryCount));
      setSeenCount(queryCount);
    } catch {
      // ignore storage failures
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      // Always clear local session on logout even if API revoke fails.
    } finally {
      dispatch(logout());
      removeFromStorage("stationery_auth");
      removeFromStorage("user");
      removeFromStorage("userToken");
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <NavLink to="/" className="logo">
          🖋 <span>Stationery</span>Store
        </NavLink>

        <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
          <li><NavLink to="/" className="nav-link" onClick={toggleMenu}>Home</NavLink></li>
          {isOwner && <li><NavLink to="/owner" className="nav-link" onClick={toggleMenu}>Owner Panel</NavLink></li>}
          {isOwner && <li><NavLink to="/owner/queries" className="nav-link" onClick={toggleMenu}>Queries</NavLink></li>}
          <li><NavLink to="/shop/all" className="nav-link" onClick={toggleMenu}>Store</NavLink></li>
          <li><NavLink to="/about-us" className="nav-link" onClick={toggleMenu}>About</NavLink></li>
          {!isOwner && <li><NavLink to="/contact" className="nav-link" onClick={toggleMenu}>Contact</NavLink></li>}
        </ul>

        <div className="icons">
          {isOwner && (
            <NavLink
              to="/owner/queries"
              className="icon bell-icon"
              aria-label="Open owner queries"
              title="Owner queries"
              onClick={() => {
                setMenuOpen(false);
                markQueriesAsSeen();
              }}
            >
              <FiBell />
              {unreadQueryCount > 0 && <span className="cart-badge bell-badge">{unreadQueryCount}</span>}
            </NavLink>
          )}
          {!isOwner && (
            <NavLink to="/cart" className="icon">
              <FiShoppingCart />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </NavLink>
          )}
          {user ? (
            <>
              <NavLink to="/profile" className="profile-avatar" aria-label="Open profile" title={user?.name || "Profile"}>
                {profileInitial}
              </NavLink>
              <button
                className="login-btn logout-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="login-btn">Login</NavLink>
              <NavLink to="/signin" className="login-btn">Sign Up</NavLink>
            </>
          )}
        </div>

        <div className="menu-icon" onClick={toggleMenu}>
          {menuOpen ? <FiX /> : <FiMenu />}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
