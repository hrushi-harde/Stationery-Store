import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateSession } from '../redux/Slices/AuthSlice';
import { refreshAuthToken } from '../services/api';

const decodeTokenPayload = (token) => {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
};

const getTokenExpiry = (token) => {
  const payload = decodeTokenPayload(token);
  return typeof payload?.exp === 'number' ? payload.exp * 1000 : 0;
};

const AuthBootstrap = ({ children }) => {
  const dispatch = useDispatch();
  const { user, accessToken } = useSelector((state) => state.auth);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const runBootstrap = async () => {
      const expiresAt = getTokenExpiry(accessToken);
      const shouldRefresh = !accessToken || !user || !expiresAt || Date.now() >= expiresAt - 30_000;

      if (!shouldRefresh) {
        if (mounted) setReady(true);
        return;
      }

      try {
        const nextSession = await refreshAuthToken();
        dispatch(updateSession(nextSession));
      } catch {
        dispatch(logout());
      } finally {
        if (mounted) setReady(true);
      }
    };

    runBootstrap();

    return () => {
      mounted = false;
    };
  }, [accessToken, dispatch, user]);

  if (!ready) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading secure session...</div>;
  }

  return children;
};

export default AuthBootstrap;