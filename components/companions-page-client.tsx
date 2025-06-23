'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Target, Star, TrendingUp } from 'lucide-react';
import { CompanionsList } from '@/components/companions-list';
import { CompanionForm } from '@/components/companion-form';
import type { Companion } from '@/lib/db/schema';

interface CompanionsPageClientProps {
  companions: Companion[];
}

export function CompanionsPageClient({ companions: initialCompanions }: CompanionsPageClientProps) {
  const [companions, setCompanions] = useState(initialCompanions);
  const [showForm, setShowForm] = useState(false);
  const [editingCompanion, setEditingCompanion] = useState<Companion | null>(null);
  const [companionStats, setCompanionStats] = useState({
    totalCompanions: 0,
    activeCompanions: 0,
    averageRating: '0.0',
    totalInteractions: 0,
  });
  const router = useRouter();

  const updateCompanionStats = async () => {
    const totalCompanions = companions.length;
    const activeCompanions = companions.filter(c => c.organizationId || c.positionId).length;
    
    // Calcular estatísticas básicas
    setCompanionStats({
      totalCompanions,
      activeCompanions,
      averageRating: '4.2', // Mock data - seria calculado de feedback real
      totalInteractions: totalCompanions * 25, // Mock data
    });
  };

  useEffect(() => {
    updateCompanionStats();
  }, [companions]);

  useEffect(() => {
    const handleNewCompanion = () => {
      setShowForm(true);
    };

    window.addEventListener('companions:new', handleNewCompanion);
    return () => window.removeEventListener('companions:new', handleNewCompanion);
  }, []);

  const handleCreateSuccess = () => {
    setShowForm(false);
    router.refresh();
  };

  const handleUpdateSuccess = () => {
    setEditingCompanion(null);
    router.refresh();
  };

  const handleDelete = async (companionId: string) => {
    setCompanions(prev => prev.filter(companion => companion.id !== companionId));
  };

  const handleEdit = (companion: Companion) => {
    setEditingCompanion(companion);
    setShowForm(false);
  };

  const handleCancelEdit = () => {
    setEditingCompanion(null);
  };

  const handleCancelCreate = () => {
    setShowForm(false);
  };

  return (
    <div className="p-6">
        {showForm && (
          <CompanionForm 
            onSuccess={handleCreateSuccess}
            onCancel={handleCancelCreate}
          />
        )}

        {editingCompanion && (
          <CompanionForm 
            companion={editingCompanion}
            onSuccess={handleUpdateSuccess}
            onCancel={handleCancelEdit}
          />
        )}

        {!showForm && !editingCompanion && (
          <>
            {/* Dashboard Companions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Companions</span>
                </div>
                <p className="text-2xl font-bold mt-1">{companionStats.totalCompanions}</p>
                <p className="text-sm text-muted-foreground">criados</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Vinculados</span>
                </div>
                <p className="text-2xl font-bold mt-1">{companionStats.activeCompanions}</p>
                <p className="text-sm text-muted-foreground">organizações</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Avaliação</span>
                </div>
                <p className="text-2xl font-bold mt-1">{companionStats.averageRating}</p>
                <p className="text-sm text-muted-foreground">média</p>
              </div>
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Interações</span>
                </div>
                <p className="text-2xl font-bold mt-1">{companionStats.totalInteractions}</p>
                <p className="text-sm text-muted-foreground">total</p>
              </div>
            </div>

            <CompanionsList 
              companions={companions}
              onEdit={handleEdit}
              onDelete={handleDelete}
              hideCreateButton={true}
            />
          </>
        )}
    </div>
  );
} 