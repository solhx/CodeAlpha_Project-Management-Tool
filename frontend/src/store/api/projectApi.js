// frontend/src/store/api/projectApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const projectApi = createApi({
  reducerPath: 'projectApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/projects`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.accessToken;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Project', 'Member', 'Activity'],
  endpoints: (builder) => ({
    getProjects: builder.query({
      query: (params = {}) => ({ url: '/', params }),
      providesTags: ['Project'],
    }),
    getProjectById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Project', id }],
    }),
    createProject: builder.mutation({
      query: (data) => ({ url: '/', method: 'POST', body: data }),
      invalidatesTags: ['Project'],
    }),
    updateProject: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Project', id }],
    }),
    deleteProject: builder.mutation({
      query: (id) => ({ url: `/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Project'],
    }),
    inviteMember: builder.mutation({
      query: ({ projectId, email, role }) => ({
        url: `/${projectId}/invite`,
        method: 'POST',
        body: { email, role },
      }),
      invalidatesTags: (result, error, { projectId }) => [{ type: 'Project', id: projectId }],
    }),
    updateMemberRole: builder.mutation({
      query: ({ projectId, userId, role }) => ({
        url: `/${projectId}/members/${userId}`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: (result, error, { projectId }) => [{ type: 'Project', id: projectId }],
    }),
    removeMember: builder.mutation({
      query: ({ projectId, userId }) => ({
        url: `/${projectId}/members/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { projectId }) => [{ type: 'Project', id: projectId }],
    }),
    getProjectActivity: builder.query({
      query: ({ projectId, ...params }) => ({ url: `/${projectId}/activity`, params }),
      providesTags: ['Activity'],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useInviteMemberMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
  useGetProjectActivityQuery,
} = projectApi;