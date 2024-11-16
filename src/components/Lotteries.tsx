import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import { Clock, Users, DollarSign, Loader, Tag, AlertCircle } from 'lucide-react';

interface LotteriesProps {
  contract: ethers.Contract | null;
  account: string | null;
}

interface Lottery {
  id: number;
  endTime: Date;
  prizePool: string;
  entryFee: string;
  participants: number;
  status: 'InProgress' | 'Ended' | 'Cancelled';
}

const Lotteries: React.FC<LotteriesProps> = ({ contract, account }) => {
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositing, setDepositing] = useState<number | null>(null); // Track depositing state by lottery ID
  const [participatedLotteries, setParticipatedLotteries] = useState<number[]>([]);

  useEffect(() => {
    const fetchLotteries = async () => {
      if (contract && account) {
        try {
          setLoading(true);
          const fetchedLotteries: Lottery[] = [];

          // Fetch user's participated lotteries
          const userProfile = await contract.getUserProfile(account);
          const userParticipatedLotteries = userProfile.participatedLotteries.map((id: ethers.BigNumber) => id.toNumber());
          setParticipatedLotteries(userParticipatedLotteries);

          for (let i = 0; i <= 5; i++) {
            try {
              const details = await contract.getLotteryDetails(i);
              console.log(`Lottery ${i} details:`, details);

              const entryFee = ethers.utils.formatEther(details.entryFee);

              // Only add lotteries with non-zero entry fee
              if (parseFloat(entryFee) > 0) {
                const lottery: Lottery = {
                  id: i,
                  endTime: new Date(details.endTime.toNumber() * 1000),
                  prizePool: ethers.utils.formatEther(details.prizePool),
                  entryFee: entryFee,
                  participants: details.participants.length,
                  status: ['InProgress', 'Ended', 'Cancelled'][details.status] as 'InProgress' | 'Ended' | 'Cancelled',
                };

                if (lottery.status === 'InProgress') {
                  fetchedLotteries.push(lottery);
                }
              }
            } catch (error) {
              console.log(`No lottery found for ID ${i} or error fetching:`, error);
            }
          }

          setLotteries(fetchedLotteries);
        } catch (error) {
          console.error('Failed to fetch lotteries:', error);
          toast.error('Failed to fetch lotteries');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchLotteries();
  }, [contract, account]);

  const handleDeposit = async (lotteryId: number, entryFee: string) => {
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (contract) {
      try {
        setDepositing(lotteryId);
        const tx = await contract.deposit(lotteryId, {
          value: ethers.utils.parseEther(entryFee)
        });
        await tx.wait();
        toast.success('Deposit successful!');
        // Refresh lottery after deposit
        const updatedLottery = await contract.getLotteryDetails(lotteryId);
        setLotteries(prevLotteries =>
          prevLotteries.map(lottery =>
            lottery.id === lotteryId
              ? {
                  ...lottery,
                  prizePool: ethers.utils.formatEther(updatedLottery.prizePool),
                  participants: updatedLottery.participants.length,
                }
              : lottery
          )
        );
        setParticipatedLotteries([...participatedLotteries, lotteryId]); // Mark the lottery as participated
      } catch (error) {
        console.error('Deposit failed:', error);
        toast.error('Deposit failed. Please try again.');
      } finally {
        setDepositing(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black text-gray-900 dark:text-white transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-extrabold text-center mb-12"
        >
          Active Lotteries
        </motion.h2>
        {lotteries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center text-xl text-gray-600 dark:text-gray-400"
          >
            <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            No active lotteries at the moment. Check back later!
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {lotteries.map((lottery) => {
              const hasParticipated = participatedLotteries.includes(lottery.id);
              return (
                <motion.div
                  key={lottery.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-xl font-semibold mb-4">Lottery #{lottery.id}</h3>
                    {[
                      { icon: Clock, label: 'Ends', value: lottery.endTime.toLocaleString() },
                      { icon: DollarSign, label: 'Prize Pool', value: `${lottery.prizePool} NIBI` },
                      { icon: Users, label: 'Participants', value: lottery.participants.toString() },
                      { icon: Tag, label: 'Entry Fee', value: `${lottery.entryFee} NIBI` },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center mb-4">
                        <item.icon className="h-5 w-5 text-emerald-500 mr-2" />
                        <p className="text-sm">
                          <span className="font-medium">{item.label}:</span> {item.value}
                        </p>
                      </div>
                    ))}
                    <div className="mt-5">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeposit(lottery.id, lottery.entryFee)}
                        disabled={hasParticipated || depositing === lottery.id}
                        className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                          hasParticipated
                            ? 'bg-gray-400 cursor-not-allowed opacity-60'
                            : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 ${
                          depositing === lottery.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {depositing === lottery.id ? (
                          <>
                            <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                            Depositing...
                          </>
                        ) : hasParticipated ? (
                          'Already Participated'
                        ) : (
                          `Deposit ${lottery.entryFee} NIBI`
                        )}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Lotteries;
