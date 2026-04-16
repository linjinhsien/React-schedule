import React from 'react';
import { useAuth } from '../auth/useAuth';
import { loginWithGoogle, logout } from '../firebase';
import { LogIn, LogOut, UserCircle } from 'lucide-react';

export function LoginGate({ children }: { children: React.ReactNode }) {
  const { user, loading, toggleRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg text-center">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              排班系統
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              請登入以繼續
            </p>
          </div>
          <button
            onClick={loginWithGoogle}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              <LogIn className="h-5 w-5 text-blue-500 group-hover:text-blue-400" aria-hidden="true" />
            </span>
            使用 Google 帳號登入
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">排班系統</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <UserCircle className="h-5 w-5" />
                <span>{user.name}</span>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 rounded-full">
                  {user.role === 'boss' ? '老闆' : '員工'}
                </span>
              </div>
              <button
                onClick={toggleRole}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                切換角色(Demo)
              </button>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <LogOut className="h-4 w-4 mr-1" />
                登出
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
