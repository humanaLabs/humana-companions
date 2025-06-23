import { motion } from 'framer-motion';
import type { Session } from 'next-auth';

export const Greeting = ({ session }: { session?: Session }) => {
  return (
    <div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-semibold"
      >
        Olá {session?.user?.email?.split('@')[0] || 'usuário'}!
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-2xl text-muted-foreground"
      >
        O que o seu Companion pode fazer hoje por você?
      </motion.div>
    </div>
  );
};
