// frontend/src/store/api/boardApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const boardApi = createApi({
  reducerPath: 'boardApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/boards`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.accessToken;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Board', 'Column'],
  endpoints: (builder) => ({
    getBoards: builder.query({
      query: (projectId) => ({ url: '/', params: { projectId } }),
      providesTags: ['Board'],
    }),
    getBoardById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Board', id }],
    }),
    createBoard: builder.mutation({
      query: (data) => ({ url: '/', method: 'POST', body: data }),
      invalidatesTags: ['Board'],
    }),
    updateBoard: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Board', id }],
    }),
    deleteBoard: builder.mutation({
      query: (id) => ({ url: `/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Board'],
    }),
    createColumn: builder.mutation({
      query: ({ boardId, ...data }) => ({
        url: `/${boardId}/columns`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { boardId }) => [{ type: 'Board', id: boardId }],
    }),
    updateColumn: builder.mutation({
      query: ({ boardId, columnId, ...data }) => ({
        url: `/${boardId}/columns/${columnId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { boardId }) => [{ type: 'Board', id: boardId }],
    }),
    deleteColumn: builder.mutation({
      query: ({ boardId, columnId }) => ({
        url: `/${boardId}/columns/${columnId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { boardId }) => [{ type: 'Board', id: boardId }],
    }),
    reorderColumns: builder.mutation({
      query: ({ boardId, columns }) => ({
        url: `/${boardId}/columns/reorder`,
        method: 'PATCH',
        body: { columns },
      }),
      invalidatesTags: (result, error, { boardId }) => [{ type: 'Board', id: boardId }],
    }),
  }),
});

export const {
  useGetBoardsQuery,
  useGetBoardByIdQuery,
  useCreateBoardMutation,
  useUpdateBoardMutation,
  useDeleteBoardMutation,
  useCreateColumnMutation,
  useUpdateColumnMutation,
  useDeleteColumnMutation,
  useReorderColumnsMutation,
} = boardApi;