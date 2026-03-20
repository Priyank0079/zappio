import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoading } from '../../context/LoadingContext';
import './iconLoader.css';

interface IconLoaderProps {
  forceShow?: boolean;
}

const INITIAL_SPLASH_DURATION_MS = 2000;
const SPLASH_LOGO_PATH = '/logoooo.png';
let hasShownInitialSplash = false;

const IconLoader: React.FC<IconLoaderProps> = ({ forceShow = false }) => {
  const { isRouteLoading } = useLoading();
  const [animationData, setAnimationData] = useState<any>(null);
  const [showInitialSplash, setShowInitialSplash] = useState(() => !hasShownInitialSplash);
  const show = showInitialSplash || isRouteLoading || forceShow;
  const showLogoSplash = showInitialSplash;

  useEffect(() => {
    if (!showInitialSplash) {
      return;
    }

    hasShownInitialSplash = true;

    const timer = window.setTimeout(() => {
      setShowInitialSplash(false);
    }, INITIAL_SPLASH_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [showInitialSplash]);

  useEffect(() => {
    if (show && !showLogoSplash && !animationData) {
      fetch('/animations/loading.json')
        .then(res => res.json())
        .then(data => setAnimationData(data))
        .catch(err => console.error('Failed to load animation:', err));
    }
  }, [show, showLogoSplash, animationData]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={`global-loader-overlay ${showLogoSplash ? 'global-loader-overlay--splash' : ''}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="loader-container">
            {showLogoSplash ? (
              <motion.img
                src={SPLASH_LOGO_PATH}
                alt="Zappio logo"
                className="loader-logo"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
            ) : (
              <div className="lottie-wrapper">
                {animationData ? (
                  <Lottie
                    animationData={animationData}
                    loop={true}
                    className="loader-lottie"
                  />
                ) : (
                  <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IconLoader;
