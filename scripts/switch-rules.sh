#!/bin/bash
# Script para alternar entre diferentes contextos de Cursor Rules
# Uso: ./scripts/switch-rules.sh <contexto>

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Validar parâmetros
if [ $# -ne 1 ]; then
    echo -e "${RED}❌ Uso: $0 <contexto>${NC}"
    echo -e "${GRAY}   Contextos disponíveis: core, frontend, backend, ai, docs, full${NC}"
    exit 1
fi

CONTEXT=$1
PROJECT_ROOT=$(dirname "$(dirname "$(realpath "$0")")")
ORIGINAL_RULES_FILE="$PROJECT_ROOT/.cursorrules"
BACKUP_FILE="$PROJECT_ROOT/.cursorrules.backup"

# Validar contexto
case $CONTEXT in
    core|frontend|backend|ai|docs|full)
        ;;
    *)
        echo -e "${RED}❌ Contexto inválido: $CONTEXT${NC}"
        echo -e "${GRAY}   Contextos disponíveis: core, frontend, backend, ai, docs, full${NC}"
        exit 1
        ;;
esac

# Fazer backup do arquivo atual se existir
if [ -f "$ORIGINAL_RULES_FILE" ]; then
    cp "$ORIGINAL_RULES_FILE" "$BACKUP_FILE"
    echo -e "${GREEN}✅ Backup criado: .cursorrules.backup${NC}"
fi

case $CONTEXT in
    "core")
        SOURCE_FILE="$PROJECT_ROOT/.cursorrules-core"
        DESCRIPTION="Regras fundamentais e tecnologias base"
        ;;
    "frontend")
        SOURCE_FILE="$PROJECT_ROOT/.cursorrules-frontend"
        DESCRIPTION="Design system, UI/UX e componentes React"
        ;;
    "backend")
        SOURCE_FILE="$PROJECT_ROOT/.cursorrules-backend"
        DESCRIPTION="APIs, banco de dados e server-side"
        ;;
    "ai")
        SOURCE_FILE="$PROJECT_ROOT/.cursorrules-ai"
        DESCRIPTION="Integrações AI/LLM, prompts e providers"
        ;;
    "docs")
        SOURCE_FILE="$PROJECT_ROOT/.cursorrules-docs"
        DESCRIPTION="Documentação, blueprints e estrutura"
        ;;
    "full")
        # Combinar todos os arquivos
        ALL_FILES=(
            "$PROJECT_ROOT/.cursorrules-core"
            "$PROJECT_ROOT/.cursorrules-frontend"
            "$PROJECT_ROOT/.cursorrules-backend"
            "$PROJECT_ROOT/.cursorrules-ai"
            "$PROJECT_ROOT/.cursorrules-docs"
        )
        
        # Limpar arquivo anterior
        > "$ORIGINAL_RULES_FILE"
        
        for file in "${ALL_FILES[@]}"; do
            if [ -f "$file" ]; then
                echo "# ===== $(basename "$file") =====" >> "$ORIGINAL_RULES_FILE"
                echo "" >> "$ORIGINAL_RULES_FILE"
                cat "$file" >> "$ORIGINAL_RULES_FILE"
                echo "" >> "$ORIGINAL_RULES_FILE"
                echo "" >> "$ORIGINAL_RULES_FILE"
            fi
        done
        
        echo -e "${GREEN}✅ Regras combinadas ativadas${NC}"
        echo -e "${CYAN}📋 Conteúdo: Todas as regras em um arquivo${NC}"
        exit 0
        ;;
esac

# Verificar se o arquivo fonte existe
if [ ! -f "$SOURCE_FILE" ]; then
    echo -e "${RED}❌ Arquivo não encontrado: $SOURCE_FILE${NC}"
    exit 1
fi

# Copiar o arquivo do contexto escolhido
cp "$SOURCE_FILE" "$ORIGINAL_RULES_FILE"

echo -e "${GREEN}✅ Contexto ativado: $CONTEXT${NC}"
echo -e "${CYAN}📋 Descrição: $DESCRIPTION${NC}"
echo -e "${GRAY}📁 Arquivo: $(basename "$SOURCE_FILE")${NC}"

# Mostrar informações adicionais
echo ""
echo -e "${YELLOW}🔄 Para alternar contextos use:${NC}"
echo -e "${GRAY}   ./scripts/switch-rules.sh core      # Fundamental${NC}"
echo -e "${GRAY}   ./scripts/switch-rules.sh frontend  # UI/React${NC}"
echo -e "${GRAY}   ./scripts/switch-rules.sh backend   # API/DB${NC}"
echo -e "${GRAY}   ./scripts/switch-rules.sh ai        # LLM/AI${NC}"
echo -e "${GRAY}   ./scripts/switch-rules.sh docs      # Documentação${NC}"
echo -e "${GRAY}   ./scripts/switch-rules.sh full      # Todas as regras${NC}"
echo ""
echo -e "${YELLOW}💡 Reinicie o Cursor para aplicar as novas regras${NC}" 