import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ethers } from 'ethers';
import { 
  Clock, 
  Users, 
  DollarSign, 
  Loader, 
  Tag, 
  AlertCircle, 
  RefreshCcw,
  ArrowRightLeft,
  Info
} from 'lucide-react';

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

interface ConversionRates {
  NIBItoEUCL: string;
  EUCLtoNIBI: string;
  lastUpdated: Date;
}

const Lotteries: React.FC<LotteriesProps> = ({ contract, account }) => {
  const [lotteries, setLotteries] = useState<Lottery[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositing, setDepositing] = useState<number | null>(null);
  const [participatedLotteries, setParticipatedLotteries] = useState<number[]>([]);
  const [conversionRates, setConversionRates] = useState<ConversionRates>({
    NIBItoEUCL: '0',
    EUCLtoNIBI: '0',
    lastUpdated: new Date()
  });
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);
  const [showConversionInfo, setShowConversionInfo] = useState<number | null>(null);

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
    } catch (error) {
      console.error('Failed to fetch conversion rates:', error);
      toast.error('Failed to update exchange rates');
    } finally {
      setIsUpdatingRates(false);
    }
  };

  const convertAmount = (amount: string, fromToken: 'NIBI' | 'EUCL'): string => {
    const value = parseFloat(amount);
    if (isNaN(value)) return '0';
    
    if (fromToken === 'NIBI') {
      return (value * parseFloat(conversionRates.NIBItoEUCL)).toFixed(6);
    } else {
      return (value * parseFloat(conversionRates.EUCLtoNIBI)).toFixed(6);
    }
  };

  useEffect(() => {
    const fetchLotteries = async () => {
      if (contract && account) {
        try {
          setLoading(true);
          const fetchedLotteries: Lottery[] = [];

          const userProfile = await contract.getUserProfile(account);
          const userParticipatedLotteries = userProfile.participatedLotteries.map(
            (id: ethers.BigNumber) => id.toNumber()
          );
          setParticipatedLotteries(userParticipatedLotteries);

          for (let i = 0; i <= 5; i++) {
            try {
              const details = await contract.getLotteryDetails(i);
              const entryFee = ethers.utils.formatEther(details.entryFee);

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
          await fetchConversionRates();
        } catch (error) {
          console.error('Failed to fetch lotteries:', error);
          toast.error('Failed to fetch lotteries');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchLotteries();
    const interval = setInterval(fetchConversionRates, 30000);
    return () => clearInterval(interval);
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
        toast.success('Successfully entered the lottery!');
        
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
        setParticipatedLotteries([...participatedLotteries, lotteryId]);
      } catch (error) {
        console.error('Deposit failed:', error);
        toast.error('Failed to enter lottery. Please try again.');
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
        {/* Exchange Rate Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Current Exchange Rates</h3>
            <button
              onClick={fetchConversionRates}
              disabled={isUpdatingRates}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCcw className={`h-5 w-5 text-emerald-500 ${isUpdatingRates ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">1 NIBI = </span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {conversionRates.NIBItoEUCL} EUCL
              </span>
            </div>
            <div className="text-sm text-right">
              <span className="text-gray-500 dark:text-gray-400">1 EUCL = </span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {conversionRates.EUCLtoNIBI} NIBI
              </span>
            </div>
          </div>
        </motion.div>

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
              const showingInfo = showConversionInfo === lottery.id;

              return (
                <motion.div
                  key={lottery.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm overflow-hidden shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold">Lottery #{lottery.id}</h3>
                      <button
                        onClick={() => setShowConversionInfo(showingInfo ? null : lottery.id)}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Info className="h-5 w-5 text-emerald-500" />
                      </button>
                    </div>

                    {showingInfo ? (
                      <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <h4 className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">
                          Conversion Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Entry Fee: </span>
                            <div className="flex items-center gap-2">
                              <span>{lottery.entryFee} NIBI</span>
                              <ArrowRightLeft className="h-4 w-4 text-emerald-500" />
                              <span>{convertAmount(lottery.entryFee, 'NIBI')} EUCL</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Prize Pool: </span>
                            <div className="flex items-center gap-2">
                              <span>{lottery.prizePool} NIBI</span>
                              <ArrowRightLeft className="h-4 w-4 text-emerald-500" />
                              <span>{convertAmount(lottery.prizePool, 'NIBI')} EUCL</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {[
                          { icon: Clock, label: 'Ends', value: lottery.endTime.toLocaleString() },
                          { icon: DollarSign, label: 'Prize Pool', value: `${lottery.prizePool} NIBI` },
                          { icon: Users, label: 'Participants', value: lottery.participants.toString() },
                          { icon: Tag, label: 'Entry Fee', value: `${lottery.entryFee} NIBI` },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center mb-4">
                            <item.icon className="h-5 w-5 text-emerald-500 mr-2" />
                            <p className="text-sm">
                              <span className="font-medium">{item.label}:</span>{' '}
                              <span>{item.value}</span>
                              {(item.label === 'Prize Pool' || item.label === 'Entry Fee') && (
                                <span className="text-emerald-600 dark:text-emerald-400 text-xs ml-2">
                                  ≈ {convertAmount(item.value.split(' ')[0], 'NIBI')} EUCL
                                </span>
                              )}
                            </p>
                          </div>
                        ))}
                      </>
                    )}

                    <div className="mt-5">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeposit(lottery.id, lottery.entryFee)}
                        disabled={hasParticipated || depositing === lottery.id}
                        className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                          hasParticipated
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 ${
                          depositing === lottery.id ? 'opacity-75 cursor-not-allowed' : ''
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
                          <>
                            Deposit {lottery.entryFee} NIBI
                            <span className="text-xs ml-2 opacity-75">
                              (≈ {convertAmount(lottery.entryFee, 'NIBI')} EUCL)
                            </span>
                          </>
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