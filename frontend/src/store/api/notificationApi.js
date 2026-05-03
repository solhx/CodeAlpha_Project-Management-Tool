// frontend/src/store/api/notificationApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/notifications`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.accessToken;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Notification'],
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: (params) => ({ url: '/', params }),
      providesTags: ['Notification'],
    }),
    getUnreadCount: builder.query({
      query: () => '/count',
      providesTags: ['Notification'],
    }),
    markRead: builder.mutation({
      query: (id) => ({ url: `/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
    markAllRead: builder.mutation({
      query: () => ({ url: '/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),
    deleteNotification: builder.mutation({
      query: (id) => ({ url: `/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
} = notificationApi;