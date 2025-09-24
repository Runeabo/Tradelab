
import React, { useState } from 'react';
import { User } from '../types';
import { registerUser } from '../services/gameService';
import { BRAND_NAME } from '../constants';
import { LoginIcon } from './icons';

interface EmailGateProps {
  onLogin: (user: User) => void;
}

const EmailGate: React.FC<EmailGateProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    const user = registerUser(email);
    onLogin(user);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-2xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">
            Welcome to {BRAND_NAME}
          </h1>
          <p className="mt-2 text-gray-400">An AI-Powered Trading Arcade</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter your email to play"
            />
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 transition-transform transform hover:scale-105"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LoginIcon />
              </span>
              Start Playing
            </button>
          </div>
        </form>
         <p className="text-center text-xs text-gray-500">
            This is a simulation. No real money is involved.
          </p>
      </div>
    </div>
  );
};

export default EmailGate;