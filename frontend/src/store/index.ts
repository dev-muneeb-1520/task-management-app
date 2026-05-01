import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import tasksReducer from "@/features/tasks/tasksSlice";
import adminReducer from "@/features/admin/adminSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: tasksReducer,
    admin: adminReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
