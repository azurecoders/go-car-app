import { createSlice } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

const loadRideFromStorage = async () => {
  try {
    const rideInfo = AsyncStorage.getItem("rideInfo");
    return rideInfo ? JSON.parse(rideInfo) : null;
  } catch (error) {
    return null;
  }
};

const initialState = {
  ride: null,
};

const rideSlice = createSlice({
  name: "ride",
  initialState,
  reducers: {
    setRideDetails: (state, action) => {
      state.ride = action.payload;
      AsyncStorage.setItem("rideInfo", JSON.stringify(action.payload));
    },
  },
});

export const { setRideDetails } = rideSlice.actions;

export default rideSlice.reducer;

export const loadRide = () => async (dispatch) => {
  const rideInfo = await loadRideFromStorage();
  if (rideInfo) {
    dispatch(setRideDetails(rideInfo));
  }
};
