'use client';

import { useState } from 'react';
import { ChevronDownIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';

interface ToolResultProps {
  toolName: string;
  result: any;
  displayName?: string;
}

export function ToolResult({ toolName, result, displayName }: ToolResultProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    expanded: {
      height: 'auto',
      opacity: 1,
      marginTop: '0.5rem',
      marginBottom: '0.5rem',
    },
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-row gap-2 items-center bg-gray-800 dark:bg-gray-900 px-3 py-2 rounded">
        <div className="text-green-400">✓</div>
        <div className="font-medium text-sm text-white flex-1">
          {displayName || toolName}
        </div>
        <button
          type="button"
          className="cursor-pointer text-gray-400 hover:text-white"
          onClick={() => {
            setIsExpanded(!isExpanded);
          }}
        >
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDownIcon />
          </motion.div>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
            className="pl-4 border-l border-gray-200 dark:border-gray-700"
          >
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded text-gray-700 dark:text-gray-300 overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 