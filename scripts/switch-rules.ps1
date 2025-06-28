#!/usr/bin/env pwsh
# Script para alternar entre diferentes contextos de Cursor Rules
# Uso: .\scripts\switch-rules.ps1 <contexto>

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("core", "frontend", "backend", "ai", "docs", "full")]
    [string]$Context
)

$projectRoot = Split-Path -Parent $PSScriptRoot
$originalRulesFile = Join-Path $projectRoot ".cursorrules"
$backupFile = Join-Path $projectRoot ".cursorrules.backup"

# Fazer backup do arquivo atual se existir
if (Test-Path $originalRulesFile) {
    Copy-Item $originalRulesFile $backupFile -Force
    Write-Host "✅ Backup criado: .cursorrules.backup" -ForegroundColor Green
}

# Processar contexto escolhido
if ($Context -eq "full") {
    # Combinar todos os arquivos
    $allFiles = @(
        (Join-Path $projectRoot ".cursorrules-core"),
        (Join-Path $projectRoot ".cursorrules-frontend"),
        (Join-Path $projectRoot ".cursorrules-backend"),
        (Join-Path $projectRoot ".cursorrules-ai"),
        (Join-Path $projectRoot ".cursorrules-docs")
    )
    
    $combinedContent = @()
    foreach ($file in $allFiles) {
        if (Test-Path $file) {
            $combinedContent += "# ===== $(Split-Path -Leaf $file) ====="
            $combinedContent += ""
            $combinedContent += Get-Content $file
            $combinedContent += ""
            $combinedContent += ""
        }
    }
    
    $combinedContent | Out-File -FilePath $originalRulesFile -Encoding UTF8 -Force
    Write-Host "✅ Regras combinadas ativadas" -ForegroundColor Green
    Write-Host "📋 Conteúdo: Todas as regras em um arquivo" -ForegroundColor Cyan
    
    # Mostrar informações adicionais
    Write-Host ""
    Write-Host "🔄 Para alternar contextos use:" -ForegroundColor Yellow
    Write-Host "   .\scripts\switch-rules.ps1 core      # Fundamental" -ForegroundColor Gray
    Write-Host "   .\scripts\switch-rules.ps1 frontend  # UI/React" -ForegroundColor Gray
    Write-Host "   .\scripts\switch-rules.ps1 backend   # API/DB" -ForegroundColor Gray
    Write-Host "   .\scripts\switch-rules.ps1 ai        # LLM/AI" -ForegroundColor Gray
    Write-Host "   .\scripts\switch-rules.ps1 docs      # Documentação" -ForegroundColor Gray
    Write-Host "   .\scripts\switch-rules.ps1 full      # Todas as regras" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 Reinicie o Cursor para aplicar as novas regras" -ForegroundColor Yellow
    return
}

# Configurar arquivo fonte e descrição baseado no contexto
switch ($Context) {
    "core" {
        $sourceFile = Join-Path $projectRoot ".cursorrules-core"
        $description = "Regras fundamentais e tecnologias base"
    }
    "frontend" {
        $sourceFile = Join-Path $projectRoot ".cursorrules-frontend"
        $description = "Design system, UI/UX e componentes React"
    }
    "backend" {
        $sourceFile = Join-Path $projectRoot ".cursorrules-backend"
        $description = "APIs, banco de dados e server-side"
    }
    "ai" {
        $sourceFile = Join-Path $projectRoot ".cursorrules-ai"
        $description = "Integrações AI/LLM, prompts e providers"
    }
    "docs" {
        $sourceFile = Join-Path $projectRoot ".cursorrules-docs"
        $description = "Documentação, blueprints e estrutura"
    }
}

# Verificar se o arquivo fonte existe
if (-not (Test-Path $sourceFile)) {
    Write-Host "❌ Arquivo não encontrado: $sourceFile" -ForegroundColor Red
    exit 1
}

# Copiar o arquivo do contexto escolhido
Copy-Item $sourceFile $originalRulesFile -Force

Write-Host "✅ Contexto ativado: $Context" -ForegroundColor Green
Write-Host "📋 Descrição: $description" -ForegroundColor Cyan
Write-Host "📁 Arquivo: $(Split-Path -Leaf $sourceFile)" -ForegroundColor Gray

# Mostrar informações adicionais
Write-Host ""
Write-Host "🔄 Para alternar contextos use:" -ForegroundColor Yellow
Write-Host "   .\scripts\switch-rules.ps1 core      # Fundamental" -ForegroundColor Gray
Write-Host "   .\scripts\switch-rules.ps1 frontend  # UI/React" -ForegroundColor Gray
Write-Host "   .\scripts\switch-rules.ps1 backend   # API/DB" -ForegroundColor Gray
Write-Host "   .\scripts\switch-rules.ps1 ai        # LLM/AI" -ForegroundColor Gray
Write-Host "   .\scripts\switch-rules.ps1 docs      # Documentação" -ForegroundColor Gray
Write-Host "   .\scripts\switch-rules.ps1 full      # Todas as regras" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Reinicie o Cursor para aplicar as novas regras" -ForegroundColor Yellow 