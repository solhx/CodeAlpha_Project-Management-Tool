//src/store/index.js
import { configureStore }    from '@reduxjs/toolkit';
import { setupListeners }    from '@reduxjs/toolkit/query';
import {
  persistStore, persistReducer,
  FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER,
} from 'redux-persist';

const createNoopStorage = () => ({
  getItem   : (_key)        => Promise.resolve(null),
  setItem   : (_key, value) => Promise.resolve(value),
  removeItem: (_key)        => Promise.resolve(),
});

// SSR-safe storage
const storage =
  typeof window !== 'undefined'
    ? require('redux-persist/lib/storage').default
    : createNoopStorage();

import authReducer         from './slices/authSlice';
import projectReducer      from './slices/projectSlice';
import boardReducer        from './slices/boardSlice';
import taskReducer         from './slices/taskSlice';         // ✅ ADDED
import notificationReducer from './slices/notificationSlice';
import { authApi }         from './api/authApi';
import { projectApi }      from './api/projectApi';
import { boardApi }        from './api/boardApi';
import { taskApi }         from './api/taskApi';
import { commentApi }      from './api/commentApi';
import { notificationApi } from './api/notificationApi';

const authPersistConfig = {
  key      : 'auth',
  storage,
  whitelist: ['user', 'accessToken', 'isAuthenticated'],
};

export const store = configureStore({
  reducer: {
    auth          : persistReducer(authPersistConfig, authReducer),
    projects      : projectReducer,
    board         : boardReducer,
    tasks         : taskReducer,          // ✅ ADDED — fixes "state.tasks is undefined"
    notifications : notificationReducer,
    [authApi.reducerPath]        : authApi.reducer,
    [projectApi.reducerPath]     : projectApi.reducer,
    [boardApi.reducerPath]       : boardApi.reducer,
    [taskApi.reducerPath]        : taskApi.reducer,
    [commentApi.reducerPath]     : commentApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(
      authApi.middleware,
      projectApi.middleware,
      boardApi.middleware,
      taskApi.middleware,
      commentApi.middleware,
      notificationApi.middleware,
    ),
});

export const persistor = persistStore(store);
setupListeners(store.dispatch);