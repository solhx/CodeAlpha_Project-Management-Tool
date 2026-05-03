// frontend/src/store/api/commentApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const commentApi = createApi({
  reducerPath: 'commentApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/comments`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.accessToken;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Comment'],
  endpoints: (builder) => ({
    getComments: builder.query({
      query: (taskId) => ({ url: '/', params: { taskId } }),
      providesTags: (result, error, taskId) => [{ type: 'Comment', id: taskId }],
    }),
    createComment: builder.mutation({
      query: (data) => ({ url: '/', method: 'POST', body: data }),
      invalidatesTags: (result, error, { taskId }) => [{ type: 'Comment', id: taskId }],
    }),
    updateComment: builder.mutation({
      query: ({ id, content, taskId }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: { content },
      }),
      invalidatesTags: (result, error, { taskId }) => [{ type: 'Comment', id: taskId }],
    }),
    deleteComment: builder.mutation({
      query: ({ id, taskId }) => ({ url: `/${id}`, method: 'DELETE' }),
      invalidatesTags: (result, error, { taskId }) => [{ type: 'Comment', id: taskId }],
    }),
    toggleReaction: builder.mutation({
      query: ({ commentId, emoji, taskId }) => ({
        url: `/${commentId}/reactions`,
        method: 'POST',
        body: { emoji },
      }),
      invalidatesTags: (result, error, { taskId }) => [{ type: 'Comment', id: taskId }],
    }),
  }),
});

export const {
  useGetCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useToggleReactionMutation,
} = commentApi;