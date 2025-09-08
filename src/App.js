import React from 'react';
import { UserProvider } from './contexts/UserContext';
import AppRouter from './Router';
import KaTeXLoader from './components/KaTeXLoader';

function App() {
  return (
    <UserProvider>
      <div className="min-h-screen bg-gray-50 font-serif">
        <KaTeXLoader />
        <AppRouter />
      </div>
    </UserProvider>
  );
}

export default App;