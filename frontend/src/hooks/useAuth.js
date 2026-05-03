// frontend/src/hooks/useAuth.js
import { useSelector, useDispatch } from 'react-redux';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectAccessToken,
  logout,
} from '@/store/slices/authSlice';
import { useLogoutMutation } from '@/store/api/authApi';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const accessToken = useSelector(selectAccessToken);
  const [logoutApi, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } finally {
      dispatch(logout());
      router.push('/login');
    }
  };

  const hasProjectRole = (project, ...roles) => {
    if (!project || !user) return false;
    if (project.owner?._id === user._id || project.owner === user._id) return true;
    const member = project.members?.find(
      (m) => (m.user?._id || m.user) === user._id
    );
    return member ? roles.includes(member.role) : false;
  };

  return {
    user,
    isAuthenticated,
    accessToken,
    handleLogout,
    isLoggingOut,
    hasProjectRole,
  };
};