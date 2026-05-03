// frontend/src/store/api/taskApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
// ✅ Import boardApi to cross-invalidate its cache after task mutations
// No circular dependency: boardApi doesn't import from taskApi
import { boardApi } from './boardApi';

export const taskApi = createApi({
  reducerPath: 'taskApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/tasks`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.accessToken;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Task'],
  endpoints: (builder) => ({
    getTasks: builder.query({
      query: (params) => ({ url: '/', params }),
      providesTags: ['Task'],
    }),
    getMyTasks: builder.query({
      query: (params = {}) => ({ url: '/my-tasks', params }),
      providesTags: ['Task'],
    }),
    getTaskById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Task', id }],
    }),

    createTask: builder.mutation({
      query: (data) => ({ url: '/', method: 'POST', body: data }),
      invalidatesTags: ['Task'],
      // ✅ FIX: After task creation succeeds, also invalidate the boardApi cache
      // boardApi and taskApi are separate createApi instances — they cannot
      // see each other's tags. Without this, boardApi's getBoardById cache
      // stays stale and the KanbanBoard never refetches to show the new task.
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled; // Wait for task creation to succeed
          // Invalidate the specific board that was affected
          // arg.boardId is passed from CreateTaskModal ✅
          dispatch(
            boardApi.util.invalidateTags([{ type: 'Board', id: arg.boardId }])
          );
        } catch {
          // Task creation failed — no need to invalidate anything
        }
      },
    }),

    updateTask: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Task', id }],
    }),

    deleteTask: builder.mutation({
      query: (id) => ({ url: `/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Task'],
      // ✅ FIX: Also refetch the board after deletion so task count updates
      // We don't have boardId here so we invalidate ALL active board queries.
      // This is slightly broader but correct — only active board queries refetch.
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(boardApi.util.invalidateTags(['Board']));
        } catch {}
      },
    }),

    moveTask: builder.mutation({
      query: ({ taskId, targetColumnId, order }) => ({
        url: `/${taskId}/move`,
        method: 'PATCH',
        body: { targetColumnId, order },
      }),
      invalidatesTags: ['Task'],
      // ✅ FIX: Refetch board after move so columns stay in sync
      // KanbanBoard already handles the UI optimistically via localTasks,
      // but the board needs to refetch to confirm the server state.
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(boardApi.util.invalidateTags(['Board']));
        } catch {}
      },
    }),

    assignTask: builder.mutation({
      query: ({ taskId, assignees }) => ({
        url: `/${taskId}/assign`,
        method: 'PATCH',
        body: { assignees },
      }),
      invalidatesTags: (result, error, { taskId }) => [{ type: 'Task', id: taskId }],
    }),

    updateChecklist: builder.mutation({
      query: ({ taskId, checklist }) => ({
        url: `/${taskId}/checklist`,
        method: 'PATCH',
        body: { checklist },
      }),
      invalidatesTags: (result, error, { taskId }) => [{ type: 'Task', id: taskId }],
    }),
  }),
});

export const {
  useGetTasksQuery,
  useGetMyTasksQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useMoveTaskMutation,
  useAssignTaskMutation,
  useUpdateChecklistMutation,
} = taskApi;