import React from "react";
import "./loading.css"; 
import logo from "../../assets/logo.png";

const Loading = ({ text = "Loading..." }) => {
  return (
    <div className="loading-overlay">
      <div className="spinner-container">
        <div className="spinner-ring"></div>
        <img src={logo} alt="Logo" className="spinner-logo" />
      </div>
      <p className="loading-text">{text}</p>
    </div>
  );
};

export default Loading;