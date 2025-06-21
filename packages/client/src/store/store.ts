import { configureStore } from '@reduxjs/toolkit';
import campsiteReducer from './campsiteSlice';

const store = configureStore({
  reducer: {
    campsites: campsiteReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;