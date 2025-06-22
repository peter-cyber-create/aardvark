'use client';

import React, { useEffect } from 'react';
import { initializeApp } from "@/lib/initialize-app";
import { registerServiceWorker } from "@/lib/register-sw";

type ClientInitializerProps = {
  children: React.ReactNode;
};

const ClientInitializer = ({ children }: ClientInitializerProps) => {
  useEffect(() => {
    initializeApp();
    registerServiceWorker();
  }, []);

  return <>{children}</>;
};

export { ClientInitializer };
