"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./index";
import { initializeAuth } from "@/features/auth/authSlice";
import NotificationsSocketManager from "@/components/shared/NotificationsSocketManager";

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    store.dispatch(initializeAuth());
  }, []);

  return (
    <Provider store={store}>
      <NotificationsSocketManager />
      {children}
    </Provider>
  );
}
