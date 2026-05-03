// frontend/src/store/slices/notificationSlice.js
import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    unreadCount: 0,
    notifications: [],
  },
  reducers: {
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    incrementUnread: (state) => {
      state.unreadCount += 1;
    },
    decrementUnread: (state) => {
      if (state.unreadCount > 0) state.unreadCount -= 1;
    },
    resetUnread: (state) => {
      state.unreadCount = 0;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
    },
  },
});

export const {
  setUnreadCount, incrementUnread,
  decrementUnread, resetUnread, addNotification,
} = notificationSlice.actions;

export default notificationSlice.reducer;
