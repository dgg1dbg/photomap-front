import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";

function Header({ authenticated, username }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove the token from local storage
    navigate("/"); // Redirect to the Sign In page after logging out
    window.location.reload(); // Optionally reload the page to reset state
  };

  return (
    <div className="header-container">
      <Link to="/" className="header-link">Photo Map</Link>
      {!authenticated && (
        <>
          <Link to="/signin" className="header-link">
            Sign In
          </Link>
          <Link to="/signup" className="header-link">
            Sign Up
          </Link>
        </>
      )}
      {authenticated && (
        <>
          <Link to={"/user/" + username} className="header-link">
            Profile
          </Link>
          <Link to="/post/create" className="header-link">
            New Post
          </Link>
          <button onClick={handleLogout} className="header-link logout-button">
            Logout
          </button>
        </>
      )}
    </div>
  );
}

export default Header;