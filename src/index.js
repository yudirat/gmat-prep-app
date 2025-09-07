// This is the entry point of the React application.

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Import global CSS styles
import App from './App'; // Import the main App component
import reportWebVitals from './reportWebVitals'; // Import function for reporting web vitals

// Create a React root and link it to the 'root' element in index.html
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the main App component within React's StrictMode
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Function to report web performance metrics (e.g., for analytics)
// Learn more: https://bit.ly/CRA-vitals
reportWebVitals();