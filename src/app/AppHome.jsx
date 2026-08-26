import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import ClientHome from './client/ClientHome';
import ProviderHome from './provider/ProviderHome';

export default function AppHome() {
  const { isProvider } = useAuth();
  return isProvider ? <ProviderHome /> : <ClientHome />;
}
