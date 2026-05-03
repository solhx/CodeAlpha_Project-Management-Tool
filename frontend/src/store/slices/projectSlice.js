// frontend/src/store/slices/projectSlice.js
import { createSlice } from '@reduxjs/toolkit';

const projectSlice = createSlice({
  name: 'projects',
  initialState: {
    projects:       [],
    currentProject: null,
    isLoading:      false,
    error:          null,
  },
  reducers: {
    setProjects: (state, action) => {
      state.projects = action.payload;
    },
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    addProject: (state, action) => {
      state.projects.unshift(action.payload);
    },
    updateProject: (state, action) => {
      const index = state.projects.findIndex((p) => p._id === action.payload._id);
      if (index !== -1) state.projects[index] = action.payload;
      if (state.currentProject?._id === action.payload._id) {
        state.currentProject = action.payload;
      }
    },
    removeProject: (state, action) => {
      state.projects = state.projects.filter((p) => p._id !== action.payload);
    },
  },
});

export const {
  setProjects, setCurrentProject,
  addProject, updateProject, removeProject,
} = projectSlice.actions;

export default projectSlice.reducer;