'use client'

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { Toaster } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Home from '../components/Home';
import Lotteries from '../components/Lotteries';
import Profile from '../components/Profile';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [username, setUsername] = useState<string>('');
  const [isRegistered, setIsRegistered] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(contract);
  
        const accounts = await provider.send("eth_requestAccounts", []);
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const userProfile = await contract.getUserProfile(accounts[0]);
          if (userProfile.username) {
            setUsername(userProfile.username);
            setIsRegistered(true);
          }
        }
      }
    };
    init();
  }, []);  

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
  
        if (contract) {
          const userProfile = await contract.getUserProfile(address);
          if (userProfile.username) {
            setUsername(userProfile.username);
            setIsRegistered(true);
          }
        }
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    }
  };  

  const registerUsername = async (newUsername: string) => {
    if (contract && account) {
      try {
        const tx = await contract.registerUsername(newUsername);
        await tx.wait();
        setUsername(newUsername);
        setIsRegistered(true);
      } catch (error) {
        console.error('Failed to register username:', error);
      }
    }
  };

  const renderPage = () => {
    if (!isRegistered && currentPage !== 'home') {
      return <Home />;
    }

    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'lotteries':
        return <Lotteries contract={contract} account={account} />;
      case 'profile':
        return <Profile contract={contract} account={account} username={username} />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <Navbar
        account={account}
        username={username}
        connectWallet={connectWallet}
        setCurrentPage={setCurrentPage}
        registerUsername={registerUsername}
        isRegistered={isRegistered}
      />
      <main className="container mx-auto p-4 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {renderPage()}
        </motion.div>
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}