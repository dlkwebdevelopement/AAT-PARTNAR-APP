import React, { createContext, useContext, useState, useEffect } from 'react';
import AxiosService from './AxioService'; 

const BaseChargeContext = createContext();

export const BaseChargeProvider = ({ children }) => {
  const [baseCharges, setBaseCharges] = useState({
    auto: 50,
    car: 150,
    van: 150,
    bus: 150,
    truck: 150
  });

  const [loadingBaseCharges, setLoadingBaseCharges] = useState(true);

  useEffect(() => {
    const fetchBaseCharges = async () => {
      try {
        const res = await AxiosService.get('vendor/base-charges');
        if (res.status === 200 && res.data.charges) {
          const fetchedCharges = {};
          res.data.charges.forEach(charge => {
            fetchedCharges[charge.vehicleCategory.toLowerCase()] = charge.amount;
          });
          setBaseCharges(prev => ({ ...prev, ...fetchedCharges }));
        }
      } catch (err) {
        console.error('Failed to fetch base charges:', err);
      } finally {
        setLoadingBaseCharges(false);
      }
    };

    fetchBaseCharges();
  }, []);

  return (
    <BaseChargeContext.Provider value={{ baseCharges, loadingBaseCharges }}>
      {children}
    </BaseChargeContext.Provider>
  );
};

export const useBaseCharges = () => {
  return useContext(BaseChargeContext);
};
