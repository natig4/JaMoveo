import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth-slice";
import songsReducer from "./songs-slice";
import profileFormsReducer from "./profile-forms-slice";
import socketReducer from "./socket-slice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    songs: songsReducer,
    profileForms: profileFormsReducer,
    socket: socketReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
