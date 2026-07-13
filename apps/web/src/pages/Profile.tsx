import React, { useEffect, useState } from 'react';
import { auth } from '../config/supabase';
import { useNavigate } from 'react-router-dom';

interface SupabaseUser {
  id: string;
  email: string | null;
  user_metadata: any;
  created_at: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 p-4 md:p-8 animate-fade-in">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white mb-8">Profile</h1>
        
        <div className="glass-card p-6 md:p-8">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-4xl font-bold border border-emerald-500/30">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">{user?.user_metadata?.full_name || 'Farmer'}</h2>
              <p className="text-gray-400">{user?.email}</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-medium text-white mb-4">Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-raised p-4 rounded-lg border border-white/5">
                  <p className="text-sm text-gray-400 mb-1">User ID</p>
                  <p className="text-white font-mono text-sm break-all">{user?.id}</p>
                </div>
                <div className="bg-surface-raised p-4 rounded-lg border border-white/5">
                  <p className="text-sm text-gray-400 mb-1">Account Created</p>
                  <p className="text-white">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-white/10 pt-6">
              <button
                onClick={handleSignOut}
                className="w-full md:w-auto px-6 py-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 font-medium rounded-xl transition-all border border-rose-500/20"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
