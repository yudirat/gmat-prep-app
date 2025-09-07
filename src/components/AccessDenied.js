// This component displays an access denied message.
import React from 'react';

/**
 * AccessDenied component displays a simple message indicating that the user does not have permission to view a page.
 */
export default function AccessDenied() { 
    return (
        <div className="text-center p-10 bg-red-100 border-l-4 border-red-500 text-red-700">
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p>You do not have permission to view this page.</p>
        </div>
    ); 
}