import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  ShieldCheck,
  DollarSign,
  Cpu,
  BarChart3,
  Users,
  ArrowRightLeft,
  RefreshCcw,
  Link as LinkIcon,
  Ticket,
  Trophy,
} from 'lucide-react';

const features = [
  { name: 'Fast & Fair', description: 'Instant results with blockchain transparency', icon: Zap },
  { name: 'Cross-Chain Ready', description: 'Seamless integration with Euclid Protocol', icon: LinkIcon },
  { name: 'Secure', description: 'Smart contract powered security', icon: ShieldCheck },
  { name: 'Nibiru Powered', description: 'Leveraging cutting-edge blockchain tech', icon: Cpu },
];

const stats = [
  { name: 'Active Users', value: '10,000+', icon: Users },
  { name: 'Total Prizes Awarded', value: '$1M+', icon: Trophy },
  { name: 'Average ROI', value: '120%', icon: BarChart3 },
];

const howItWorks = [
  { 
    step: 1, 
    title: 'Connect & Register',
    description: 'Connect your wallet and register a username',
    icon: Users 
  },
  { 
    step: 2, 
    title: 'Choose Lottery',
    description: 'Select from active lotteries using NIBI or EUCL',
    icon: Ticket 
  },
  { 
    step: 3, 
    title: 'Win Big',
    description: 'Participate and win in your preferred token',
    icon: Trophy 
  },
];

interface ScrollAnimatedSectionProps {
  children: React.ReactNode;
  delay?: number;
}

interface ConversionRates {
  NIBItoEUCL: string;
  EUCLtoNIBI: string;
  lastUpdated: Date;
}

const ScrollAnimatedSection: React.FC<ScrollAnimatedSectionProps> = ({ children, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.8, delay }}
    >
      {children}
    </motion.div>
  );
};

export default function Home() {
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
    } catch (error) {
      console.error('Failed to fetch conversion rates:', error);
    } finally {
      setIsUpdatingRates(false);
    }
  };

  useEffect(() => {
    fetchConversionRates();
    const interval = setInterval(fetchConversionRates, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black text-gray-900 dark:text-white transition-all duration-500">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mx-auto max-w-4xl"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
            <span className="block transition-colors duration-500">Unlock Your</span>
            <span className="block mt-2 bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 text-transparent bg-clip-text transition-all duration-500">
              Fortune
            </span>
          </h1>
          <p className="mt-6 mx-auto text-xl max-w-xl text-gray-600 dark:text-gray-300 transition-colors duration-500">
            Experience the future of cross-chain lotteries powered by Nibiru and Euclid Protocol. 
            Play with NIBI or EUCL tokens - the choice is yours.
          </p>
          <motion.div 
            className="mt-10 flex justify-center gap-4 flex-wrap"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 rounded-md bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 text-white font-medium hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-emerald-500/50"
              onClick={() => {
                const featuresSection = document.getElementById('features');
                featuresSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Learn More
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 rounded-md border-2 border-emerald-500 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400 font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-300"
            >
              Start Playing
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Features Section */}
        <ScrollAnimatedSection delay={0.2}>
          <div className="mt-24 text-center mx-auto max-w-4xl" id="features">
            <h2 className="text-3xl font-extrabold mb-12 transition-colors duration-500">Why Choose FortuneUnlock?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature) => (
                <motion.div
                  key={feature.name}
                  className="relative p-6 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex justify-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 flex items-center justify-center transition-all duration-500">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <p className="text-lg font-medium transition-colors duration-500">{feature.name}</p>
                  <p className="mt-2 text-base text-gray-600 dark:text-gray-300 transition-colors duration-500">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollAnimatedSection>

        {/* Cross-Chain Integration Section */}
        <ScrollAnimatedSection delay={0.3}>
          <div className="mt-24 text-center mx-auto max-w-4xl">
            <h2 className="text-3xl font-extrabold mb-12 transition-colors duration-500">Cross-Chain Integration</h2>
            <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="flex flex-col items-center space-y-6">
                <div className="flex items-center space-x-4">
                  <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/28508.png" alt="Nibiru" className="h-12 w-12 rounded-full" />
                  <ArrowRightLeft className="h-6 w-6 text-emerald-500" />
                  <img src="https://devnet.api.euclidprotocol.com/static/vsl.webp" alt="Euclid" className="h-12 w-12 rounded-full" />
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Participate seamlessly using either NIBI or EUCL tokens. Our integration with Euclid Protocol 
                  ensures the best rates and fastest cross-chain transactions.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Current NIBI Price</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {conversionRates.NIBItoEUCL} EUCL
                    </p>
                  </div>
                  <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                    <p className="text-sm font-medium text-cyan-700 dark:text-cyan-300">Current EUCL Price</p>
                    <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                      {conversionRates.EUCLtoNIBI} NIBI
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollAnimatedSection>

        {/* How It Works Section */}
        <ScrollAnimatedSection delay={0.4}>
          <div className="mt-24 text-center mx-auto max-w-5xl">
            <h2 className="text-3xl font-extrabold mb-12 transition-colors duration-500">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {howItWorks.map(({ step, title, description, icon: Icon }) => (
                <motion.div
                  key={step}
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 flex items-center justify-center text-lg font-bold mb-4 text-white transition-all duration-500">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{title}</h3>
                    <p className="text-base text-gray-600 dark:text-gray-300 transition-colors duration-500">
                      {description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollAnimatedSection>

        {/* Stats Section */}
        <ScrollAnimatedSection delay={0.6}>
          <div className="mt-24 text-center mx-auto max-w-5xl">
            <h2 className="text-3xl font-extrabold mb-12 transition-colors duration-500">
              FortuneUnlock by the Numbers
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {stats.map((stat) => (
                <motion.div 
                  key={stat.name} 
                  className="p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 flex justify-center items-center space-x-2 transition-colors duration-500">
                    <stat.icon className="h-5 w-5" />
                    <span>{stat.name}</span>
                  </div>
                  <p className="mt-1 text-3xl font-semibold bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 text-transparent bg-clip-text transition-all duration-500">
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollAnimatedSection>

        {/* Token Integration Benefits */}
        <ScrollAnimatedSection delay={0.7}>
          <div className="mt-24 text-center mx-auto max-w-4xl">
            <h2 className="text-3xl font-extrabold mb-12 transition-colors duration-500">
              Multi-Token Benefits
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg"
              >
                <h3 className="text-xl font-semibold mb-4 text-emerald-600 dark:text-emerald-400">NIBI Token</h3>
                <ul className="space-y-3 text-left">
                  <li className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-emerald-500" />
                    <span>Native Nibiru chain token</span>
                  </li>
                  <li className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-emerald-500" />
                    <span>Fast transaction speeds</span>
                  </li>
                  <li className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-emerald-500" />
                    <span>Instant prize distribution</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg"
              >
                <h3 className="text-xl font-semibold mb-4 text-cyan-600 dark:text-cyan-400">EUCL Token</h3>
                <ul className="space-y-3 text-left">
                  <li className="flex items-center">
                    <LinkIcon className="h-5 w-5 mr-2 text-cyan-500" />
                    <span>Cross-chain compatibility</span>
                  </li>
                  <li className="flex items-center">
                    <ArrowRightLeft className="h-5 w-5 mr-2 text-cyan-500" />
                    <span>Seamless token swaps</span>
                  </li>
                  <li className="flex items-center">
                    <ShieldCheck className="h-5 w-5 mr-2 text-cyan-500" />
                    <span>Enhanced liquidity options</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>

          <div className="mt-8"></div>

          {/* Exchange Rate Banner */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-4xl mb-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium">Live Exchange Rates</span>
              </div>
              <button
                onClick={fetchConversionRates}
                disabled={isUpdatingRates}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <RefreshCcw className={`h-5 w-5 text-emerald-500 ${isUpdatingRates ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
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
              <div className="col-span-2 text-xs text-center text-gray-500 dark:text-gray-400">
                Last updated: {conversionRates.lastUpdated.toLocaleTimeString()}
              </div>
            </div>
          </motion.div>
        </ScrollAnimatedSection>

        {/* Final Call to Action */}
        <ScrollAnimatedSection delay={0.8}>
          <div className="mt-24 text-center">
            <h2 className="text-3xl font-extrabold mb-4 transition-colors duration-500">Ready to Test Your Luck?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 transition-colors duration-500">
              Join thousands of players and start your winning streak today with your preferred token.
            </p>
            <motion.div 
              className="inline-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button 
                className="px-8 py-3 rounded-md bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 text-white font-medium hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-emerald-500/50"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Start Playing Now
              </button>
            </motion.div>
          </div>
        </ScrollAnimatedSection>
      </div>
    </div>
  );
}