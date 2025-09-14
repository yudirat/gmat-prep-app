import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import AccessDenied from './AccessDenied';

/**
 * Higher-order component for role-based authorization
 * @param {string[]} allowedRoles - Array of roles allowed to access the component
 * @returns {Function} - Component wrapper function
 */
const withAuthorization = (allowedRoles) => (WrappedComponent) => {
  // Validate input
  if (!Array.isArray(allowedRoles) || !allowedRoles.length) {
    throw new Error('allowedRoles must be a non-empty array of strings');
  }

  const WithAuthorization = (props) => {
    const { user, userProfile, isAuthReady, error } = useUser();
    const location = useLocation();

    // Handle authentication loading state
    if (!isAuthReady) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    // Handle authentication errors
    if (error) {
      return (
        <div className="text-red-600 p-4">
          Authentication error: {error.message}
        </div>
      );
    }

    // Redirect to login if not authenticated
    if (!user) {
      return (
        <Navigate 
          to="/login" 
          state={{ from: location.pathname }}
          replace
        />
      );
    }

    // Handle missing user profile
    if (!userProfile) {
      return (
        <div className="text-yellow-600 p-4">
          Loading user profile...
        </div>
      );
    }

    // Validate user role
    if (!userProfile.role || typeof userProfile.role !== 'string') {
      console.error('Invalid user role:', userProfile.role);
      return <AccessDenied reason="Invalid user role configuration" />;
    }

    const hasRequiredRole = allowedRoles.includes(userProfile.role);

    // Audit log for access attempts (in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `Access attempt to ${location.pathname}:`,
        `User: ${userProfile.email}`,
        `Role: ${userProfile.role}`,
        `Allowed: ${hasRequiredRole}`
      );
    }

    if (hasRequiredRole) {
      return <WrappedComponent {...props} />;
    }

    return (
      <AccessDenied 
        userRole={userProfile.role} 
        requiredRoles={allowedRoles}
        path={location.pathname}
      />
    );
  };

  // Set display name for debugging
  const componentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithAuthorization.displayName = `WithAuthorization(${componentName})`;

  return WithAuthorization;
};

export default withAuthorization;
