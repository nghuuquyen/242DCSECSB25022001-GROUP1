// ProfileEditPanel.js
"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function ProfileEditPanel() {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const accountId = user?.id;
  const initialUsername = user?.name || '';
  const initialPhone = user?.phone || '';
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    username: initialUsername,
    phone: initialPhone,
    newPassword: '',
    reEnterPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.name || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  // Add this inside your component, after the other useEffects
  useEffect(() => {
    if (activeTab === 'profile' && user) {
      setFormData(prev => ({
        ...prev,
        username: user.name || '',
        phone: user.phone || ''
      }));
    }
  }, [activeTab, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setSuccessMessage('');
  };

  const handlePhoneInput = (e) => {
    const { value } = e.target;
    if (/^[+]?\d*$/.test(value)) handleInputChange(e);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?\d{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }
      
      if (!formData.reEnterPassword) {
        newErrors.reEnterPassword = 'Please confirm your new password';
      } else if (formData.newPassword !== formData.reEnterPassword) {
        newErrors.reEnterPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // Check if user data is available
    if (!user || !user.id) {
      setErrors({ submit: 'User session not found. Please log in again.' });
      return;
    }

    setIsLoading(true);
    setSuccessMessage('');

    try {
      const updateData = {
        account_id: user.id,
        username: formData.username,
        phone_number: formData.phone,
        ...(formData.newPassword && { new_password: formData.newPassword })
      };

      console.log('Sending update data:', updateData);
      console.log('Account ID:', user.id);
      console.log('User object:', user);

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        // Try to read the error response from the server
        const errorData = await response.json(); // Assuming API always returns JSON errors
        console.error('Non-OK response error data:', errorData);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('Response result:', result);

      if (result.success) {
        setSuccessMessage('Profile updated successfully!');
        setFormData(prev => ({
          ...prev,
          newPassword: '',
          reEnterPassword: ''
        }));

        // Update localStorage with new info
        const updatedUser = {
          ...user,
          name: formData.username,
          phone: formData.phone
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);

        // Trigger a storage event to update other components
        window.dispatchEvent(new Event('storage'));
      } else {
        setErrors({ submit: result.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Update profile error:', error);
      
      // Check if it's a network error
      if (error.message.includes('Failed to fetch')) {
        setErrors({ submit: 'Network error. Please check your connection and try again.' });
      } else if (error.message.includes('HTTP error!')) {
        setErrors({ submit: error.message }); // Display specific HTTP error message
      }
      else {
        setErrors({ submit: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkAccount = async (provider) => {
    alert(`${provider} account linking will be implemented here`);
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <motion.div
      className="bg-white rounded-lg shadow-sm"
      variants={formVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="p-6">
        <div className="flex border-b border-gray-200 mb-6">
          <motion.button
            className={`px-4 py-2 text-base font-medium border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'text-green-700 border-green-500'
                : 'text-gray-700 hover:text-green-700 border-transparent'
            }`}
            onClick={() => setActiveTab('profile')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Profile
          </motion.button>
          <motion.button
            className={`px-4 py-2 text-base font-medium border-b-2 transition-colors ${
              activeTab === 'notifications'
                ? 'text-green-700 border-green-500'
                : 'text-gray-700 hover:text-green-700 border-transparent'
            }`}
            onClick={() => setActiveTab('notifications')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Notifications
          </motion.button>
        </div>

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-base"
          >
            {successMessage}
          </motion.div>
        )}

        {errors.submit && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-base"
          >
            {errors.submit}
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4"
            variants={formVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div>
              <label htmlFor="username" className="block text-base font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                id="username"
                className={`block w-full rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base p-3 border transition-colors ${
                  errors.username ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Enter your username"
              />
              {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
            </motion.div>

            <motion.div>
              <label htmlFor="phone" className="block text-base font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                className={`block w-full rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base p-3 border transition-colors ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.phone}
                onChange={handlePhoneInput}
                placeholder="Enter your phone number"
                pattern="^\+?\d{10,15}$"
                inputMode="tel"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </motion.div>

            <motion.div>
              <label htmlFor="new-password" className="block text-base font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                id="new-password"
                className={`block w-full rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base p-3 border transition-colors ${
                  errors.newPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.newPassword}
                onChange={handleInputChange}
                placeholder="Leave blank to keep current password"
              />
              {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>}
            </motion.div>

            <motion.div>
              <label htmlFor="re-enter-password" className="block text-base font-medium text-gray-700 mb-1">
                Re-enter Password
              </label>
              <input
                type="password"
                name="reEnterPassword"
                id="re-enter-password"
                className={`block w-full rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base p-3 border transition-colors ${
                  errors.reEnterPassword ? 'border-red-300' : 'border-gray-300'
                }`}
                value={formData.reEnterPassword}
                onChange={handleInputChange}
                placeholder="Re-enter new password"
              />
              {errors.reEnterPassword && <p className="text-red-500 text-sm mt-1">{errors.reEnterPassword}</p>}
            </motion.div>

            <motion.div className="col-span-full">
              <motion.button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center rounded-md border border-transparent bg-green-600 py-3 px-6 text-lg font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  'Update Profile'
                )}
              </motion.button>
            </motion.div>
          </motion.form>
        )}

        {activeTab === 'notifications' && (
          <motion.div
            variants={formVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <p className="text-gray-600 text-base">Notification settings will be available here.</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Example for a React header component
export function Header() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user info from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <header>
      {/* ...existing header code... */}
      {user ? (
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">{user.name}</span>
          <span className="text-gray-300">{user.phone}</span>
        </div>
      ) : (
        <a href="/signin_registration" className="text-white">Sign In</a>
      )}
    </header>
  );
}