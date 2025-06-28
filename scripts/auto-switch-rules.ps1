param(
    [Parameter(Mandatory=$false)]
    [string]$FilePath
)

$projectRoot = Split-Path -Parent $PSScriptRoot

if (-not $FilePath) {
    Write-Host "Uso: .\scripts\auto-switch-rules.ps1 <caminho-do-arquivo>" -ForegroundColor Yellow
    Write-Host "Exemplo: .\scripts\auto-switch-rules.ps1 components/ui/button.tsx" -ForegroundColor Gray
    exit 0
}

function Get-ContextFromFile {
    param($file)
    
    $file = $file -replace '\\', '/'
    
    # Docs primeiro (mais específico)
    if ($file -match '^projeto/|docs/|README|blueprint') {
        return 'docs'
    }
    # AI específico
    elseif ($file -match '^lib/ai/|ai\.ts|tool\.ts|mcp\.ts') {
        return 'ai'
    }
    # Backend específico
    elseif ($file -match '^app/api/|^lib/db/|^lib/auth/|\.sql$|drizzle\.|middleware\.ts') {
        return 'backend'
    }
    # Frontend específico (não pegar .md)
    elseif ($file -match '^components/|\.tsx$|\.css$|tailwind\.|ui' -and $file -notmatch '\.md$') {
        return 'frontend'
    }
    # Markdown geral para docs
    elseif ($file -match '\.md$|prompt|llm') {
        return 'docs'
    }
    else {
        return 'core'
    }
}

$detectedContext = Get-ContextFromFile $FilePath

Write-Host "Auto-switching para contexto: $detectedContext" -ForegroundColor Cyan
Write-Host "Baseado no arquivo: $FilePath" -ForegroundColor Gray

$switchScript = Join-Path $projectRoot "scripts\switch-rules.ps1"
& $switchScript $detectedContext

Write-Host "Contexto aplicado automaticamente!" -ForegroundColor Green 