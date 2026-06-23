import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { logout, updateSession } from "../redux/Slices/AuthSlice";
import { getCurrentUser, refreshAuthToken } from "../services/api";
import { removeFromStorage } from "../services/storage";
import "./Profile.css";

const Profile = () => {
  const dispatch = useDispatch();
  const { user, accessToken } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!user) return;

      setLoading(true);
      try {
        if (accessToken) {
          await getCurrentUser(accessToken);
        }

        const nextSession = await refreshAuthToken();
        dispatch(updateSession(nextSession));
      } catch {
        dispatch(logout());
        removeFromStorage("stationery_auth");
        removeFromStorage("user");
        removeFromStorage("userToken");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [accessToken, dispatch, user]);

  return (
    <div className="profile">
      <div className="profile-card">
        <h1>My Profile</h1>
        <div className="profile-row">
          <span>Name</span>
          <span>{user?.name || "Guest"}</span>
        </div>
        <div className="profile-row">
          <span>Email</span>
          <span>{user?.email || "Not provided"}</span>
        </div>
        <div className="profile-row">
          <span>Member Since</span>
          <span>April 2026</span>
        </div>
        <div className="profile-note">
          {loading
            ? "Refreshing secure session..."
            : "Profile editing will be available once the backend is connected."}
        </div>
        <Link to="/orders" className="profile-link">
          View Order History
        </Link>
      </div>
    </div>
  );
};

export default Profile;
