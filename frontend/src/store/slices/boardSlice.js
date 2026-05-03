// frontend/src/store/slices/boardSlice.js
import { createSlice } from '@reduxjs/toolkit';

const boardSlice = createSlice({
  name: 'board',
  initialState: {
    currentBoard: null,
    columns: [],
    tasks: [],
    isLoading: false,
    onlineMembers: [],
  },
  reducers: {
    setCurrentBoard: (state, action) => {
      state.currentBoard = action.payload;
    },
    setColumns: (state, action) => {
      state.columns = action.payload;
    },
    setTasks: (state, action) => {
      state.tasks = action.payload;
    },
    addTask: (state, action) => {
      state.tasks.push(action.payload);
    },
    updateTask: (state, action) => {
      const index = state.tasks.findIndex((t) => t._id === action.payload._id);
      if (index !== -1) state.tasks[index] = { ...state.tasks[index], ...action.payload };
    },
    removeTask: (state, action) => {
      state.tasks = state.tasks.filter((t) => t._id !== action.payload);
    },
    moveTaskLocally: (state, action) => {
      const { taskId, targetColumnId, order } = action.payload;
      const task = state.tasks.find((t) => t._id === taskId);
      if (task) {
        task.column = targetColumnId;
        task.order = order;
      }
    },
    setOnlineMembers: (state, action) => {
      state.onlineMembers = action.payload;
    },
    addOnlineMember: (state, action) => {
      const exists = state.onlineMembers.find((m) => m._id === action.payload._id);
      if (!exists) state.onlineMembers.push(action.payload);
    },
    removeOnlineMember: (state, action) => {
      state.onlineMembers = state.onlineMembers.filter((m) => m._id !== action.payload);
    },
  },
});

export const {
  setCurrentBoard, setColumns, setTasks, addTask,
  updateTask, removeTask, moveTaskLocally,
  setOnlineMembers, addOnlineMember, removeOnlineMember,
} = boardSlice.actions;

export default boardSlice.reducer;