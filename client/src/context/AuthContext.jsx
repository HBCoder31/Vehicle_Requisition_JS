import { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  loading: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return { user: action.payload, loading: false, error: null };
    case 'AUTH_ERROR':
      return { user: null, loading: false, error: action.payload };
    case 'LOGOUT':
      return { user: null, loading: false, error: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session from JWT cookie on mount
  useEffect(() => {
    // Detect reload on startup
    let isReload = false;
    try {
      const navigationEntries = performance.getEntriesByType('navigation');
      isReload = (navigationEntries.length > 0 && navigationEntries[0].type === 'reload') || performance.navigation.type === 1;
    } catch (e) {
      // Fallback if performance API is not available
    }

    try {
      if (isReload) {
        if (sessionStorage.getItem('inAppRefresh') === 'true') {
          sessionStorage.removeItem('inAppRefresh');
        } else {
          sessionStorage.setItem('forceLogout', 'true');
        }
      }
    } catch (e) {
      console.warn('sessionStorage is not accessible:', e);
    }

    async function checkAuth() {
      let shouldForceLogout = false;
      try {
        if (sessionStorage.getItem('forceLogout') === 'true') {
          sessionStorage.removeItem('forceLogout');
          shouldForceLogout = true;
        }
      } catch (e) {
        console.warn('sessionStorage is not accessible:', e);
      }

      if (shouldForceLogout) {
        try {
          await api.post('/auth/logout');
        } catch (err) {}
        dispatch({ type: 'AUTH_ERROR', payload: null });
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        dispatch({ type: 'AUTH_SUCCESS', payload: data.user });
      } catch {
        dispatch({ type: 'AUTH_ERROR', payload: null });
      }
    }
    checkAuth();
  }, []);

  const login = () => {
    // Redirect to backend Google OAuth route
    window.location.href = '/api/auth/google';
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    }
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
