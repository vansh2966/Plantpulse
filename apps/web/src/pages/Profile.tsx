import React, { useEffect, useState } from 'react';
import { auth } from '../config/supabase';
import { useNavigate } from 'react-router-dom';



const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

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
    <div className="min-h-[calc(100vh-4rem)] bg-stone-50 p-4 md:p-8 animate-fade-in font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-4xl font-black text-stone-800 mb-8">Profile</h1>
        
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-stone-200/50">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-4xl font-bold border-4 border-white shadow-sm">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-stone-800">{user?.user_metadata?.full_name || 'Farmer'}</h2>
              <p className="text-stone-500 font-medium">{user?.email}</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="border-t border-stone-200 pt-6">
              <h3 className="text-lg font-bold text-stone-800 mb-4">Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/50">
                  <p className="text-sm font-bold text-stone-500 mb-1">User ID</p>
                  <p className="text-stone-800 font-mono text-sm break-all">{user?.id}</p>
                </div>
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/50">
                  <p className="text-sm font-bold text-stone-500 mb-1">Account Created</p>
                  <p className="text-stone-800 font-medium">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-stone-200 pt-6">
              <button
                onClick={handleSignOut}
                className="w-full md:w-auto px-6 py-4 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-2xl transition-all border border-rose-200 shadow-sm"
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
