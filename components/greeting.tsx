import { motion } from 'framer-motion';
import type { Session } from 'next-auth';
import { useEffect, useState } from 'react';
import type { Companion } from '@/lib/db/schema';

export const Greeting = ({
  session,
  selectedCompanionId,
}: { session?: Session; selectedCompanionId?: string }) => {
  const [selectedCompanion, setSelectedCompanion] = useState<Companion | null>(
    null,
  );
  const [isLoadingCompanion, setIsLoadingCompanion] = useState(false);

  // Buscar dados do companion selecionado
  useEffect(() => {
    if (selectedCompanionId) {
      setIsLoadingCompanion(true);
      fetch('/api/companions')
        .then((response) => response.json())
        .then((data) => {
          const companion = data.companions?.find(
            (c: Companion) => c.id === selectedCompanionId,
          );
          setSelectedCompanion(companion || null);
        })
        .catch((error) => {
          console.error('Erro ao buscar companion:', error);
          setSelectedCompanion(null);
        })
        .finally(() => {
          setIsLoadingCompanion(false);
        });
    } else {
      setSelectedCompanion(null);
    }
  }, [selectedCompanionId]);

  // Extrair nome do usuário do email ou usar nome completo se disponível
  const getUserName = () => {
    if (!session?.user) return 'Usuário';

    // Se tem nome completo, usar ele
    if (session.user.name && session.user.name !== session.user.email) {
      return session.user.name;
    }

    // Se não tem nome, extrair do email
    if (session.user.email) {
      const emailPart = session.user.email.split('@')[0];
      // Se o email começa com "guest-", mostrar apenas "Usuário"
      if (emailPart.startsWith('guest-')) {
        return 'Usuário';
      }
      // Capitalizar primeira letra de cada palavra
      return emailPart
        .split(/[._-]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    return 'Usuário';
  };

  // Obter nome do companion selecionado
  const getCompanionName = () => {
    if (isLoadingCompanion) return 'carregando...';
    if (selectedCompanion) return selectedCompanion.name;
    return 'Companion Super Hero';
  };

  return (
    <div
      key="overview"
      className="max-w-3xl mx-auto mt-8 md:mt-20 px-4 md:px-8 flex flex-col justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-xl md:text-2xl font-semibold"
      >
        Olá {getUserName()}!
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-lg md:text-2xl text-muted-foreground leading-relaxed"
      >
        O que o seu{' '}
        <span className="font-medium text-foreground">
          {getCompanionName()}
        </span>{' '}
        pode fazer hoje por você?
      </motion.div>
    </div>
  );
};
