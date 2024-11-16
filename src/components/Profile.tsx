import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { User, Ticket, DollarSign, Wallet } from 'lucide-react';

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

const Profile: React.FC<ProfileProps> = ({ contract, account }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [lotteryDetails, setLotteryDetails] = useState<LotteryDetails[]>([]);
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(true);

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

          // Fetch details for participated lotteries
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

          // Fetch MetaMask balance
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const balance = await provider.getBalance(account);
          setBalance(ethers.utils.formatEther(balance));

        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserProfile();
  }, [contract, account]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="text-center text-gray-600 dark:text-gray-300">
        No profile found. Please register a username.
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
          <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">User Profile</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-300">Personal details and lottery history.</p>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700">
              <dl>
                {[
                  { label: 'Username', value: userProfile.username, icon: User },
                  { label: 'Wallet Address', value: account, icon: Wallet },
                  { label: 'Balance', value: `${balance} NIBI`, icon: Wallet },
                  { label: 'Total Participations', value: userProfile.totalParticipations.toString(), icon: Ticket },
                  { label: 'Total Winnings', value: `${userProfile.totalWinnings} NIBI`, icon: DollarSign },
                ].map((item, index) => (
                  <motion.div 
                    key={item.label}
                    className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'} px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 flex items-center">
                      <item.icon className="h-5 w-5 mr-2 text-emerald-500" />
                      {item.label}
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">{item.value}</dd>
                  </motion.div>
                ))}
              </dl>
            </div>
          </div>

          {/* Participated Lotteries Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Participated Lotteries</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-300">Details of lotteries you&apos;ve entered.</p>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700">
              {lotteryDetails.map((lottery, index) => (
                <div key={lottery.id} className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'} px-4 py-5 sm:px-6`}>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white">Lottery #{lottery.id}</h4>
                  <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Status</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{lottery.status}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">End Time</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{lottery.endTime.toLocaleString()}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Prize Pool</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{lottery.prizePool} NIBI</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Entry Fee</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{lottery.entryFee} NIBI</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-300">Winner</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {lottery.status === 'Ended' 
                          ? (lottery.winner === account 
                              ? 'You won!' 
                              : `${lottery.winner}`)
                          : 'Not yet determined'}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;