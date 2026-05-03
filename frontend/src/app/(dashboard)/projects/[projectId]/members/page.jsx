// frontend/src/app/(dashboard)/projects/[projectId]/members/page.jsx
'use client';
import { useState } from 'react';
import {
  useGetProjectByIdQuery,
  useInviteMemberMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
} from '@/store/api/projectApi';
import { useAuth } from '@/hooks/useAuth';

const ROLES = ['owner', 'admin', 'member', 'viewer'];
const ROLE_COLORS = {
  owner:  'bg-purple-100 text-purple-700',
  admin:  'bg-blue-100 text-blue-700',
  member: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-600',
};

export default function MembersPage({ params }) {
  const { projectId } = params;
  const { user } = useAuth();
  const { data } = useGetProjectByIdQuery(projectId);
  const project = data?.data?.project;

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole,  setInviteRole]  = useState('member');
  const [inviteError, setInviteError] = useState('');

  const [inviteMember,      { isLoading: isInviting }]  = useInviteMemberMutation();
  const [updateMemberRole]                               = useUpdateMemberRoleMutation();
  const [removeMember]                                   = useRemoveMemberMutation();

  const isOwner = project?.owner?._id === user?._id ||
                  project?.owner === user?._id;

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    try {
      await inviteMember({ projectId, email: inviteEmail, role: inviteRole }).unwrap();
      setInviteEmail('');
    } catch (err) {
      setInviteError(err?.data?.message || 'Failed to invite member');
    }
  };

  const handleRoleChange = async (userId, role) => {
    await updateMemberRole({ projectId, userId, role });
  };

  const handleRemove = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    await removeMember({ projectId, userId });
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Team Members</h1>
        <p className="text-slate-500 mt-1">Manage who has access to this project</p>
      </div>

      {/* Invite Form */}
      {isOwner && (
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Invite Member</h2>
          {inviteError && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 border border-red-200">
              ⚠️ {inviteError}
            </div>
          )}
          <form onSubmit={handleInvite} className="flex gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@email.com"
              className="input-field flex-1"
              required
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="input-field w-32"
            >
              {ROLES.filter((r) => r !== 'owner').map((r) => (
                <option key={r} value={r} className="capitalize">{r}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isInviting}
              className="btn-primary text-sm px-5"
            >
              {isInviting ? 'Inviting...' : 'Invite'}
            </button>
          </form>
        </div>
      )}

      {/* Members List */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">
            Members ({project?.members?.length || 0})
          </h2>
        </div>
        <div className="divide-y divide-slate-50">
          {project?.members?.map((member) => {
            const memberUser = member.user;
            const isSelf = memberUser?._id === user?._id;
            const isProjectOwner = project?.owner?._id === memberUser?._id;

            return (
              <div key={memberUser?._id} className="flex items-center gap-4 px-6 py-4">
                <img
                  src={memberUser?.avatar?.url ||
                    `https://ui-avatars.com/api/?name=${memberUser?.name}&background=random`}
                  alt={memberUser?.name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-800 truncate">{memberUser?.name}</p>
                    {isSelf && (
                      <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 truncate">{memberUser?.email}</p>
                </div>

                <div className="flex items-center gap-2">
                  {isOwner && !isProjectOwner ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(memberUser._id, e.target.value)}
                      className="text-sm border border-slate-200 rounded-lg px-2 py-1 
                                 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      {ROLES.filter((r) => r !== 'owner').map((r) => (
                        <option key={r} value={r} className="capitalize">{r}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`badge ${ROLE_COLORS[member.role]} capitalize`}>
                      {member.role}
                    </span>
                  )}

                  {isOwner && !isProjectOwner && !isSelf && (
                    <button
                      onClick={() => handleRemove(memberUser._id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1 
                                 rounded-lg hover:bg-red-50"
                      title="Remove member"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}