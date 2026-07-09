import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'History', path: '/history' }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 w-full z-40 glass-card border-x-0 border-t-0 rounded-none px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto h-16 flex justify-between items-center">
        {/* Logo */}
        <div className="flex-shrink-0 flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="PlantPulse Logo" className="h-8 w-8 rounded-lg" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
              PlantPulse
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <div className="flex space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive(link.path)
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <span className="font-medium text-sm">
                {auth.currentUser?.email?.[0].toUpperCase() || 'U'}
              </span>
            </button>

            {isProfileOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsProfileOpen(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 glass-card z-50 animate-fade-in-up">
                  <div className="px-4 py-2 text-xs text-gray-400 truncate border-b border-white/10">
                    {auth.currentUser?.email}
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-200 hover:bg-white/5 hover:text-white"
                  >
                    Your Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-400 hover:text-white focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden glass-card absolute top-16 left-0 w-full animate-slide-up border-x-0 border-t-0 rounded-none">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.path)
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.name}
              </Link>
            ))}
            <div className="border-t border-white/10 pt-2 mt-2">
              <Link
                to="/profile"
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/5"
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleSignOut();
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-rose-400 hover:bg-rose-500/10"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
