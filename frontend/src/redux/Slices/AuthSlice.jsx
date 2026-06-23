import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  accessToken: null,
  tokenType: "bearer",
  expiresIn: 0,
  issuedAt: null,
};

const AuthSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.tokenType = action.payload.tokenType || "bearer";
      state.expiresIn = action.payload.expiresIn || 0;
      state.issuedAt = action.payload.issuedAt || Date.now();
    },
    register: (state, action) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.tokenType = action.payload.tokenType || "bearer";
      state.expiresIn = action.payload.expiresIn || 0;
      state.issuedAt = action.payload.issuedAt || Date.now();
    },
    updateSession: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.tokenType = action.payload.tokenType || "bearer";
      state.expiresIn = action.payload.expiresIn || 0;
      state.issuedAt = action.payload.issuedAt || Date.now();
      if (action.payload.user) {
        state.user = action.payload.user;
      }
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.tokenType = "bearer";
      state.expiresIn = 0;
      state.issuedAt = null;
    },
  },
});

export const { login, register, updateSession, logout } = AuthSlice.actions;
export default AuthSlice.reducer;
