import React from "react";
import { motion } from "framer-motion";
import { X, ExternalLink } from "lucide-react";

interface GuidedTipsCarouselProps {
  isOpen: boolean;
  onClose: () => void;
}

const tips = [
  {
    title: "Welcome to Your Real Estate Platform",
    content:
      "Create a professional booking site for your properties in just a few minutes. We'll guide you through each step.",
    image: "🏠",
    action: "Let's start",
  },
  {
    title: "Live Preview & Customization",
    content:
      "See your changes instantly in the preview panel. Customize colors, add your logo, and make it uniquely yours.",
    image: "🎨",
    action: "Got it",
  },
  {
    title: "Go Live Instantly",
    content:
      "Once complete, your custom booking site will be live at yourname.stayza.pro. Start accepting bookings right away!",
    image: "🚀",
    action: "Start building",
  },
];

export const GuidedTipsCarousel: React.FC<GuidedTipsCarouselProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentTip, setCurrentTip] = React.useState(0);

  if (!isOpen) return null;

  const nextTip = () => {
    if (currentTip < tips.length - 1) {
      setCurrentTip(currentTip + 1);
    } else {
      onClose();
    }
  };

  const prevTip = () => {
    if (currentTip > 0) {
      setCurrentTip(currentTip - 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="text-6xl mb-4">{tips[currentTip].image}</div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {tips[currentTip].title}
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {tips[currentTip].content}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center space-x-2 mb-6">
          {tips.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentTip(index)}
              className={`rounded-full transition-colors ${
                index === currentTip ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={prevTip}
            disabled={currentTip === 0}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="text-xs text-gray-500">
            {currentTip + 1} of {tips.length}
          </span>

          <button
            onClick={nextTip}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {tips[currentTip].action}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
