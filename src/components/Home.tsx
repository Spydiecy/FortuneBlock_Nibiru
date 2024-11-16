import React from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  ShieldCheck,
  DollarSign,
  Cpu,
  BarChart3,
  Users,
} from 'lucide-react';

const features = [
  { name: 'Fast & Fair', description: 'Instant results with blockchain transparency', icon: Zap },
  { name: 'Secure', description: 'Smart contract powered security', icon: ShieldCheck },
  { name: 'Big Wins', description: 'Larger prize pools with lower fees', icon: DollarSign },
  { name: 'Nibiru Powered', description: 'Leveraging cutting-edge blockchain tech', icon: Cpu },
];

const stats = [
  { name: 'Active Users', value: '10,000+', icon: Users },
  { name: 'Total Prizes Awarded', value: '$1M+', icon: DollarSign },
  { name: 'Average ROI', value: '120%', icon: BarChart3 },
];

interface ScrollAnimatedSectionProps {
  children: React.ReactNode;
  delay?: number;
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
            <span className="block transition-colors duration-500">Fortune Favors</span>
            <span className="block mt-2 bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 text-transparent bg-clip-text transition-all duration-500">
              the Bold
            </span>
          </h1>
          <p className="mt-6 mx-auto text-xl max-w-xl text-gray-600 dark:text-gray-300 transition-colors duration-500">
            Experience the thrill of next-gen blockchain lotteries. Transparent, secure, and lightning-fast on Nibiru chain.
          </p>
          <motion.div 
            className="mt-10 flex justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button className="px-8 py-3 rounded-md bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 text-white font-medium hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-emerald-500/50"
            onClick={() => {
                const featuresSection = document.getElementById('features');
                if (featuresSection) {
                  featuresSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}>
              Features
            </button>
          </motion.div>
        </motion.div>

        {/* Features Section */}
        <ScrollAnimatedSection delay={0.2}>
          <div className="mt-24 text-center mx-auto max-w-4xl" id='features'>
            <h2 className="text-3xl font-extrabold mb-12 transition-colors duration-500">Why Choose FortuneBlock?</h2>
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
                  <p className="mt-2 text-base text-gray-600 dark:text-gray-300 transition-colors duration-500">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollAnimatedSection>

        {/* How It Works Section */}
        <ScrollAnimatedSection delay={0.4}>
          <div className="mt-24 text-center mx-auto max-w-5xl">
            <h2 className="text-3xl font-extrabold mb-12 transition-colors duration-500">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: 1, description: 'Connect your wallet and register a username' },
                { step: 2, description: 'Choose an active lottery to participate in' },
                { step: 3, description: 'Deposit your desired amount of NIBI tokens' },
              ].map(({ step, description }) => (
                <motion.div
                  key={step}
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 flex items-center justify-center text-lg font-bold mb-4 text-white transition-all duration-500">
                    {step}
                  </div>
                  <p className="text-base text-gray-600 dark:text-gray-300 transition-colors duration-500">{description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollAnimatedSection>

        {/* Stats Section */}
        <ScrollAnimatedSection delay={0.6}>
          <div className="mt-24 text-center mx-auto max-w-5xl">
            <h2 className="text-3xl font-extrabold mb-12 transition-colors duration-500">FortuneBlock by the Numbers</h2>
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

        {/* Final Call to Action */}
        <ScrollAnimatedSection delay={0.8}>
          <div className="mt-24 text-center">
            <h2 className="text-3xl font-extrabold mb-4 transition-colors duration-500">Ready to Test Your Luck?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 transition-colors duration-500">
              Join thousands of players and start your winning streak today.
            </p>
            <motion.div 
              className="inline-block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button className="px-8 py-3 rounded-md bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 text-white font-medium hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-emerald-500/50"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                Create Account
              </button>
            </motion.div>
          </div>
        </ScrollAnimatedSection>
      </div>
    </div>
  );
}