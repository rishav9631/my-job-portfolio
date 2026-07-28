import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiOutlineMenu, HiX } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:4000';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking' | 'online' | 'offline'
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const checkBackendHealth = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/v1/health`, { timeout: 8000 });
      if (res.data?.success || res.data?.status === 'online') {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
      }
    } catch {
      setBackendStatus('offline');
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 14000); // Check & keep warm every 14 seconds
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  const navLinks = [
    { name: 'Mass Mailer', path: '/mass-mailer' },
    { name: 'History', path: '/history' },
    { name: 'Cover Letter', path: '/cover-letter' },
    { name: 'Compare Resume', path: '/compare-resume' },
    { name: 'ATS Scanner', path: '/ats-scanner' },
    { name: 'My Resume', path: '/my-resume' },
    { name: '⚙ Admin', path: '/admin' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#111827]/80 backdrop-blur-xl border-b border-[#1f2937]/50 font-inter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Extreme Left Status Circle + Logo / Brand Name */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <button
              onClick={checkBackendHealth}
              title={
                backendStatus === 'online'
                  ? 'Backend Live & Warm (Render Connected). Click to re-check.'
                  : backendStatus === 'offline'
                  ? 'Backend Offline / Waking Up (Render Free Tier). Click to re-check.'
                  : 'Checking backend connection...'
              }
              className="relative flex items-center justify-center p-1 rounded-full hover:bg-white/5 transition-all outline-none"
            >
              {backendStatus === 'online' && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                </span>
              )}

              {backendStatus === 'offline' && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 shadow-[0_0_8px_#f43f5e]"></span>
                </span>
              )}

              {backendStatus === 'checking' && (
                <span className="relative flex h-3 w-3">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400 animate-pulse"></span>
                </span>
              )}
            </button>

            <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#10b981] to-teal-400">
              JobTracker
            </Link>
          </div>

          {/* Desktop Navigation Links (Center) */}
          <div className="hidden md:flex flex-1 justify-center items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-[#10b981] ${
                  isActive(link.path) ? 'text-[#10b981]'  : 'text-gray-300'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* User Actions & Mobile Hamburger Menu (Right) */}
          <div className="flex items-center space-x-4">
            
            {/* Desktop User Info + Logout */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1f2937]/50 border border-[#374151]/50">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-white text-xs font-bold">
                  {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-gray-300 text-sm font-medium">{user?.username || 'User'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-red-400 text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-300 hover:text-white focus:outline-none"
              >
                {isMenuOpen ? (
                  <HiX className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <HiOutlineMenu className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#111827] border-b border-[#1f2937]/50 shadow-xl">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.path)
                    ? 'bg-[#1f2937]/50 text-[#10b981]'
                    : 'text-gray-300 hover:bg-[#1f2937]/50 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-[#1f2937]/50">
            <div className="px-4 flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center text-white text-sm font-bold">
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className="text-gray-300 font-medium">{user?.username || 'User'}</span>
            </div>
            <div className="px-2">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-[#1f2937]/50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
