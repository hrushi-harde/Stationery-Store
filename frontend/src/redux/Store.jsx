import { configureStore } from '@reduxjs/toolkit'
import CartSlice from "../redux/Slices/CartSlice"
import AuthSlice from "../redux/Slices/AuthSlice"
import { loadFromStorage, saveToStorage, removeFromStorage } from "../services/storage"

const preloadedState = {
  cart: loadFromStorage("stationery_cart", []),
  auth: loadFromStorage("stationery_auth", {
    user: null,
    accessToken: null,
    tokenType: "bearer",
    expiresIn: 0,
    issuedAt: null,
  }),
}

const Store =  configureStore({
  reducer: {
    cart : CartSlice,
    auth: AuthSlice,
  },
  preloadedState,
})

let saveTimer
Store.subscribe(() => {
  if (saveTimer) window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    const state = Store.getState()
    saveToStorage("stationery_cart", state.cart)

    const isLoggedOut = !state.auth?.user && !state.auth?.accessToken
    if (isLoggedOut) {
      removeFromStorage("stationery_auth")
      removeFromStorage("user")
      removeFromStorage("userToken")
      return
    }

    saveToStorage("stationery_auth", state.auth)
  }, 200)
})

export default Store