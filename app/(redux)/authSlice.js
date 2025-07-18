import { createSlice } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

const loadUserFromStorage = async () => {
  try {
    const userInfo = AsyncStorage.getItem("userInfo");
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    return null;
  }
};

const initialState = {
  user: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginUserAction: (state, action) => {
      state.user = action.payload;
      AsyncStorage.setItem("userInfo", JSON.stringify(action.payload));
    },
    registerUserAction: (state, action) => {
      state.user = action.payload;
      AsyncStorage.setItem("userInfo", JSON.stringify(action.payload));
    },
    loginDriverAction: (state, action) => {
      state.user = action.payload;
      AsyncStorage.setItem("userInfo", JSON.stringify(action.payload));
    },
    registerDriverAction: (state, action) => {
      state.user = action.payload;
      AsyncStorage.setItem("userInfo", JSON.stringify(action.payload));
    },
    logoutAction: (state) => {
      state.user = null;
      AsyncStorage.removeItem("userInfo");
    },
    setUserAction: (state, action) => {
      state.user = action.payload;
    },
  },
});

export const {
  loginDriverAction,
  loginUserAction,
  logoutAction,
  registerDriverAction,
  registerUserAction,
} = authSlice.actions;

export default authSlice.reducer;

export const loadUser = () => async (dispatch) => {
  const userInfo = await loadUserFromStorage();
  if (userInfo) {
    dispatch(setUserAction(userInfo));
  }
};
