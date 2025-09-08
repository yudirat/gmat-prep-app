import React, { createContext, useContext } from 'react';
import useData from '../hooks/useData';

const DataContext = createContext();

export const useDataFromContext = () => {
  return useContext(DataContext);
};

export const DataProvider = ({ children }) => {
  const data = useData();

  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
};
