// components/Profile.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { User, Ticket, DollarSign, Wallet, RefreshCcw } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProfileProps {
  contract: ethers.Contract | null;
  account: string | null;
  username: string;
}

interface UserProfile {
  username: string;
  participatedLotteries: number[];
  wonLotteries: number[];
  totalWinnings: string;
  totalParticipations: number;
}

interface LotteryDetails {
  id: number;
  endTime: Date;
  prizePool: string;
  entryFee: string;
  participants: number;
  status: 'InProgress' | 'Ended' | 'Cancelled';
  winner: string;
}

interface ConversionRates {
  NIBItoEUCL: string;
  EUCLtoNIBI: string;
  lastUpdated: Date;
}

const Profile: React.FC<ProfileProps> = ({ contract, account }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [lotteryDetails, setLotteryDetails] = useState<LotteryDetails[]>([]);
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [conversionRates, setConversionRates] = useState<ConversionRates>({
    NIBItoEUCL: '0',
    EUCLtoNIBI: '0',
    lastUpdated: new Date()
  });
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);

  const fetchConversionRates = async () => {
    try {
      setIsUpdatingRates(true);
      
      // Fetch NIBI to EUCL rate
      const NIBItoEUCLResponse = await fetch('https://testnet.api.euclidprotocol.com/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              router {
                simulate_swap(
                  asset_in: "nibi"
                  amount_in: "1000000"
                  asset_out: "euclid"
                  min_amount_out: "0"
                  swaps: ["nibi", "euclid"]
                ) {
                  amount_out
                }
              }
            }
          `
        })
      });

      const NIBItoEUCLData = await NIBItoEUCLResponse.json();
      const NIBItoEUCLRate = NIBItoEUCLData?.data?.router?.simulate_swap?.amount_out || '0';

      // Fetch EUCL to NIBI rate
      const EUCLtoNIBIResponse = await fetch('https://testnet.api.euclidprotocol.com/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              router {
                simulate_swap(
                  asset_in: "euclid"
                  amount_in: "1000000"
                  asset_out: "nibi"
                  min_amount_out: "0"
                  swaps: ["euclid", "nibi"]
                ) {
                  amount_out
                }
              }
            }
          `
        })
      });

      const EUCLtoNIBIData = await EUCLtoNIBIResponse.json();
      const EUCLtoNIBIRate = EUCLtoNIBIData?.data?.router?.simulate_swap?.amount_out || '0';

      setConversionRates({
        NIBItoEUCL: (parseFloat(NIBItoEUCLRate) / 1000000).toFixed(6),
        EUCLtoNIBI: (parseFloat(EUCLtoNIBIRate) / 1000000).toFixed(6),
        lastUpdated: new Date()
      });

      toast.success('Exchange rates updated');
    } catch (error) {
      console.error('Failed to fetch conversion rates:', error);
      toast.error('Failed to update exchange rates');
    } finally {
      setIsUpdatingRates(false);
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (contract && account) {
        try {
          setLoading(true);
          const profile = await contract.getUserProfile(account);
          
          setUserProfile({
            username: profile.username,
            participatedLotteries: profile.participatedLotteries.map((id: ethers.BigNumber) => id.toNumber()),
            wonLotteries: profile.wonLotteries.map((id: ethers.BigNumber) => id.toNumber()),
            totalWinnings: ethers.utils.formatEther(profile.totalWinnings),
            totalParticipations: profile.totalParticipations.toNumber()
          });

          const detailsPromises = profile.participatedLotteries.map(async (id: ethers.BigNumber) => {
            const details = await contract.getLotteryDetails(id);
            return {
              id: id.toNumber(),
              endTime: new Date(details.endTime.toNumber() * 1000),
              prizePool: ethers.utils.formatEther(details.prizePool),
              entryFee: ethers.utils.formatEther(details.entryFee),
              participants: details.participants.length,
              status: ['InProgress', 'Ended', 'Cancelled'][details.status],
              winner: details.winner
            };
          });

          const fetchedDetails = await Promise.all(detailsPromises);
          setLotteryDetails(fetchedDetails);

          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const balance = await provider.getBalance(account);
          setBalance(ethers.utils.formatEther(balance));

          await fetchConversionRates();
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          toast.error('Failed to load profile data');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserProfile();

    const interval = setInterval(fetchConversionRates, 30000);
    return () => clearInterval(interval);
  }, [contract, account]);

  const convertAmount = (amount: string, fromToken: 'NIBI' | 'EUCL'): string => {
    const value = parseFloat(amount);
    if (isNaN(value)) return '0';
    
    if (fromToken === 'NIBI') {
      return (value * parseFloat(conversionRates.NIBItoEUCL)).toFixed(6);
    } else {
      return (value * parseFloat(conversionRates.EUCLtoNIBI)).toFixed(6);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center text-gray-600 dark:text-gray-300">
          <p className="text-xl font-semibold mb-4">No profile found</p>
          <p>Please register a username to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black text-gray-900 dark:text-white transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Exchange Rates Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-lg rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Current Exchange Rates</h3>
              <button
                onClick={fetchConversionRates}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                disabled={isUpdatingRates}
              >
                <RefreshCcw className={`h-5 w-5 text-emerald-500 ${isUpdatingRates ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700">
              <dl>
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">1 NIBI =</dt>
                  <dd className="mt-1 text-sm text-emerald-600 dark:text-emerald-400 font-medium sm:mt-0 sm:col-span-2">
                    {conversionRates.NIBItoEUCL} EUCL
                  </dd>
                </div>
                <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">1 EUCL =</dt>
                  <dd className="mt-1 text-sm text-emerald-600 dark:text-emerald-400 font-medium sm:mt-0 sm:col-span-2">
                    {conversionRates.EUCLtoNIBI} NIBI
                  </dd>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                  Last updated: {conversionRates.lastUpdated.toLocaleTimeString()}
                </div>
              </dl>
            </div>
          </motion.div>

          {/* User Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-lg rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">User Profile</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-300">Personal details and lottery history</p>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700">
              <dl>
                {[
                  { label: 'Username', value: userProfile.username, icon: User },
                  { label: 'Wallet Address', value: account, icon: Wallet },
                  { label: 'Balance', value: `${balance} NIBI ≈ ${convertAmount(balance, 'NIBI')} EUCL`, icon: Wallet },
                  { label: 'Total Participations', value: userProfile.totalParticipations.toString(), icon: Ticket },
                  { 
                    label: 'Total Winnings', 
                    value: `${userProfile.totalWinnings} NIBI ≈ ${convertAmount(userProfile.totalWinnings, 'NIBI')} EUCL`, 
                    icon: DollarSign 
                  },
                ].map((item, index) => (
                  <motion.div 
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`${
                      index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'
                    } px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}
                  >
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
                      <item.icon className="h-5 w-5 mr-2 text-emerald-500" />
                      {item.label}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                      {item.value}
                    </dd>
                  </motion.div>
                ))}
              </dl>
            </div>
          </motion.div>

          {/* Participated Lotteries Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-lg rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Participated Lotteries</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-300">Details of lotteries you&apos;ve entered</p>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700">
            {lotteryDetails.map((lottery, index) => (
                <motion.div
                  key={lottery.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className={`${
                    index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'
                  } px-4 py-5 sm:px-6`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      Lottery #{lottery.id}
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      lottery.status === 'InProgress' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100'
                        : lottery.status === 'Ended'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                        : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                    }`}>
                      {lottery.status}
                    </span>
                  </div>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">End Time</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {lottery.endTime.toLocaleString()}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Participants</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {lottery.participants}
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Prize Pool</dt>
                      <dd className="mt-1 text-sm">
                        <span className="text-gray-900 dark:text-white">{lottery.prizePool} NIBI</span>
                        <span className="text-sm text-emerald-600 dark:text-emerald-400 ml-2">
                          ≈ {convertAmount(lottery.prizePool, 'NIBI')} EUCL
                        </span>
                      </dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Entry Fee</dt>
                      <dd className="mt-1 text-sm">
                        <span className="text-gray-900 dark:text-white">{lottery.entryFee} NIBI</span>
                        <span className="text-sm text-emerald-600 dark:text-emerald-400 ml-2">
                          ≈ {convertAmount(lottery.entryFee, 'NIBI')} EUCL
                        </span>
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Winner</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {lottery.status === 'Ended' 
                          ? (lottery.winner === account 
                              ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                  You won this lottery! 🎉
                                </span>
                              ) 
                              : `${lottery.winner.slice(0, 6)}...${lottery.winner.slice(-4)}`)
                          : 'Not yet determined'}
                      </dd>
                    </div>
                  </dl>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;