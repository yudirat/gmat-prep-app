import React from 'react';
import { useUser } from '../contexts/UserContext';
import AccessDenied from './AccessDenied';

const withAuthorization = (allowedRoles) => (WrappedComponent) => {
  const WithAuthorization = (props) => {
    const { userProfile } = useUser();

    if (!userProfile) {
      return null; // Or a loading indicator
    }

    const hasRequiredRole = allowedRoles.includes(userProfile.role);

    if (hasRequiredRole) {
      return <WrappedComponent {...props} />;
    }

    return <AccessDenied />;
  };

  return WithAuthorization;
};

export default withAuthorization;
