import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, UserCircle, Wallet, X } from 'lucide-react';
import { Switch } from '@headlessui/react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import logo from '../app/favicon.ico'

interface NavbarProps {
  account: string | null;
  username: string;
  connectWallet: () => Promise<void>;
  setCurrentPage: (page: string) => void;
  registerUsername: (username: string) => Promise<void>;
  isRegistered: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ 
  account, 
  username, 
  connectWallet, 
  setCurrentPage, 
  registerUsername, 
  isRegistered 
}) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUsername.trim()) {
      await registerUsername(newUsername.trim());
      setIsModalOpen(false);
      setNewUsername('');
    }
  };

  return (
    <>
      <nav className="bg-white dark:bg-gradient-to-r dark:from-gray-900 dark:to-black text-gray-900 dark:text-white shadow-lg fixed w-full z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center gap-4">
              <Image src={logo} alt="FortuneUnlock" width={40} height={40} />
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 text-transparent bg-clip-text">
                FortuneUnlock
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {['home', 'lotteries', 'profile'].map((page) => (
                <motion.button
                  key={page}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(page)}
                  className="text-gray-700 dark:text-white hover:bg-gradient-to-r hover:from-emerald-600 hover:to-cyan-600 dark:hover:from-emerald-400 dark:hover:to-cyan-400 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  {page.charAt(0).toUpperCase() + page.slice(1)}
                </motion.button>
              ))}
              <Switch
                checked={theme === 'dark'}
                onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`${
                  theme === 'dark' ? 'bg-gradient-to-r from-emerald-400 to-cyan-400' : 'bg-gray-200'
                } relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200`}
              >
                <span className="sr-only">Toggle dark mode</span>
                <span
                  className={`${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  } inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out`}
                >
                  {theme === 'dark' ? (
                    <Moon className="h-4 w-4 text-gray-800" />
                  ) : (
                    <Sun className="h-4 w-4 text-yellow-500" />
                  )}
                </span>
              </Switch>
              {account ? (
                isRegistered ? (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 text-white px-4 py-2 rounded-md font-bold shadow-lg hover:shadow-emerald-500/50"
                  >
                    <UserCircle className="h-5 w-5 inline-block mr-2" />
                    {username}
                  </motion.div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsModalOpen(true)}
                    className="bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 text-white px-4 py-2 rounded-md font-bold shadow-lg hover:shadow-emerald-500/50"
                  >
                    Register Username
                  </motion.button>
                )
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={connectWallet}
                  className="bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 text-white px-4 py-2 rounded-md font-bold shadow-lg hover:shadow-emerald-500/50"
                >
                  <Wallet className="h-5 w-5 inline-block mr-2" />
                  Connect Wallet
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gradient-to-b dark:from-gray-900 dark:to-black rounded-lg p-8 max-w-md w-full m-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Register Username</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleRegister}>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400 mb-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 text-white px-4 py-2 rounded-md font-bold shadow-lg hover:shadow-emerald-500/50"
                >
                  Register
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;