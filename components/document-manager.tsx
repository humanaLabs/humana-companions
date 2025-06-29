'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Search, FileText, Image, Code, Table, MoreVertical, Download, Trash2, Eye } from 'lucide-react';
import { FileIcon } from '@/components/icons';
import { toast } from 'sonner';

interface Document {
  id: string;
  title: string;
  content: string;
  kind: 'text' | 'code' | 'image' | 'sheet';
  createdAt: string;
}

interface SearchResult extends Document {
  relevanceScore: number;
  snippet: string;
}

interface DocumentManagerProps {
  className?: string;
}

const kindIcons = {
  text: FileText,
  code: Code, 
  image: Image,
  sheet: Table,
};

const kindLabels = {
  text: 'Documento',
  code: 'Código',
  image: 'Imagem',
  sheet: 'Planilha',
};

export function DocumentManager({ className }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKind, setSelectedKind] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Carregar documentos inicialmente
  useEffect(() => {
    loadDocuments();
  }, []);

  // Buscar quando query muda
  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/documents');
      
      if (!response.ok) {
        throw new Error('Falha ao carregar documentos');
      }
      
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      toast.error('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        ...(selectedKind !== 'all' && { kind: selectedKind }),
      });
      
      const response = await fetch(`/api/documents/search?${params}`);
      
      if (!response.ok) {
        throw new Error('Falha na busca');
      }
      
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Erro na busca:', error);
      toast.error('Erro na busca de documentos');
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/files/upload-document', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha no upload');
      }
      
      const data = await response.json();
      
      // Atualizar lista de documentos
      setDocuments(prev => [data.document, ...prev]);
      toast.success('Documento enviado com sucesso!');
      
      return data.document;
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error(error instanceof Error ? error.message : 'Erro no upload');
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Falha ao deletar documento');
      }
      
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      setSearchResults(prev => prev.filter(doc => doc.id !== id));
      toast.success('Documento deletado com sucesso');
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast.error('Erro ao deletar documento');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    
    for (const file of Array.from(files)) {
      try {
        await uploadFile(file);
      } catch (error) {
        // Error já foi tratado no uploadFile
      }
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    
    for (const file of Array.from(files)) {
      try {
        await uploadFile(file);
      } catch (error) {
        // Error já foi tratado no uploadFile
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Hoje';
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  const formatFileSize = (content: string) => {
    const bytes = new Blob([content]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const currentDocuments = searchQuery.trim() ? searchResults : documents;

  return (
    <div className={className}>
      {/* Upload Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.docx,.doc,.txt,.md,.rtf,.jpg,.jpeg,.png,.gif,.webp"
      />

      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Buscar documentos..."
              className="pl-10 pr-4 py-2 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent min-w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter */}
          <select 
            className="px-3 py-2 border rounded-lg bg-background text-foreground"
            value={selectedKind}
            onChange={(e) => setSelectedKind(e.target.value)}
          >
            <option value="all">Todos os tipos</option>
            <option value="text">Documentos</option>
            <option value="code">Código</option>
            <option value="image">Imagens</option>
            <option value="sheet">Planilhas</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload size={16} />
            {uploading ? 'Enviando...' : 'Upload'}
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setShowUploadArea(!showUploadArea)}
          >
            <Plus size={16} />
            Novo Documento
          </Button>
        </div>
      </div>

      {/* Drop Zone */}
      {showUploadArea && (
        <div
          ref={dropZoneRef}
          className="bg-muted/50 rounded-lg border-2 border-dashed border-muted p-8 hover:border-muted-foreground/50 transition-colors cursor-pointer mb-6"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-sm text-muted-foreground">
              Suporta PDF, DOC, DOCX, TXT, MD, RTF e imagens (até 10MB)
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Carregando documentos...</p>
        </div>
      )}

      {/* Search Results Info */}
      {searchQuery.trim() && (
        <div className="mb-4 text-sm text-muted-foreground">
          {searchResults.length > 0 
            ? `${searchResults.length} resultado(s) para "${searchQuery}"`
            : `Nenhum resultado para "${searchQuery}"`
          }
        </div>
      )}

      {/* Documents Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentDocuments.map((doc) => {
            const Icon = kindIcons[doc.kind];
            const isSearchResult = 'relevanceScore' in doc;
            
            return (
              <div
                key={doc.id}
                className="bg-card border rounded-lg p-4 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-muted-foreground">
                    <Icon size={28} />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1">
                      <button 
                        className="p-1 hover:bg-muted rounded text-muted-foreground"
                        title="Visualizar"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="p-1 hover:bg-muted rounded text-muted-foreground"
                        title="Deletar"
                        onClick={() => deleteDocument(doc.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <h3 className="font-medium text-foreground mb-1 truncate" title={doc.title}>
                  {doc.title}
                </h3>
                
                {isSearchResult && (doc as SearchResult).snippet && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2" 
                     dangerouslySetInnerHTML={{ 
                       __html: (doc as SearchResult).snippet 
                     }} 
                  />
                )}
                
                <p className="text-sm text-muted-foreground mb-2">
                  {formatDate(doc.createdAt)}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatFileSize(doc.content)}</span>
                  <span>{kindLabels[doc.kind]}</span>
                </div>
                
                {isSearchResult && (
                  <div className="mt-2 text-xs text-blue-600">
                    Relevância: {((doc as SearchResult).relevanceScore * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            );
          })}
          
          {currentDocuments.length === 0 && !loading && !searchQuery.trim() && (
            <div className="col-span-full text-center py-12">
              <div className="mx-auto h-16 w-16 text-muted-foreground mb-4">
                <FileIcon size={64} />
              </div>
              <p className="text-lg font-medium text-muted-foreground mb-2">
                Nenhum documento encontrado
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Faça upload de seus primeiros documentos para começar
              </p>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload size={16} />
                Fazer Upload
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 