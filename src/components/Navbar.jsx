import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiOutlineMenu, HiX } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:4000';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Silent background keep-alive ping to keep Render backend warm (every 14s)
  const keepBackendWarm = useCallback(async () => {
    try {
      await axios.get(`${BASE_URL}/api/v1/health`, { timeout: 8000 });
    } catch {
      // Ignore background errors silently
    }
  }, []);

  useEffect(() => {
    keepBackendWarm();
    const interval = setInterval(keepBackendWarm, 14000); // Silent ping every 14 seconds
    return () => clearInterval(interval);
  }, [keepBackendWarm]);

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
          
          {/* Logo / Brand Name */}
          <div className="flex-shrink-0 flex items-center">
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
