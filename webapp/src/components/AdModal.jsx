import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdTask from './AdTask';

const AdModal = ({ isOpen, onClose, onComplete }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { type: "spring", duration: 0.5 }
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={backdropVariants}
      >
        <motion.div
          className="w-11/12 max-w-md bg-gradient-to-b from-[#22223B] to-[#4A4E69] rounded-2xl p-4 relative"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-white/60 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="pt-2">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Watch Ad to Earn Stars</h2>
            <AdTask onComplete={onComplete} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdModal;
