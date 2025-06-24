#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createDirectories() {
  const dirs = [
    'tests/screenshots',
    'tests/screenshots/elements',
    'tests/screenshots/docs',
    'tests/screenshots/baselines',
    'tests/screenshots/diffs'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`✅ Criado diretório: ${dir}`, 'green');
    }
  });
}

function runTests(testType = 'all') {
  log('\n🚀 Executando Testes Visuais Automatizados', 'blue');
  log('='.repeat(50), 'blue');

  // Criar diretórios necessários
  createDirectories();

  const commands = {
    'admin': 'npx playwright test tests/e2e/admin-permissions.test.ts --project=chromium',
    'visual': 'npx playwright test tests/e2e/visual-regression.test.ts --project=chromium',
    'all': 'npx playwright test tests/e2e/admin-permissions.test.ts tests/e2e/visual-regression.test.ts --project=chromium',
    'cross-browser': 'npx playwright test tests/e2e/visual-regression.test.ts --project=chromium --project=firefox',
    'mobile': 'npx playwright test tests/e2e/visual-regression.test.ts --project=chromium --grep="Mobile"'
  };

  const command = commands[testType] || commands['all'];

  try {
    log(`\n📋 Executando: ${command}`, 'yellow');
    
    const output = execSync(command, { 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    log('\n✅ Testes executados com sucesso!', 'green');
    log('\n📊 Resultados:', 'blue');
    console.log(output);
    
    // Mostrar screenshots gerados
    showGeneratedScreenshots();
    
  } catch (error) {
    log('\n❌ Erro ao executar testes:', 'red');
    console.error(error.stdout || error.message);
    process.exit(1);
  }
}

function showGeneratedScreenshots() {
  const screenshotsDir = 'tests/screenshots';
  
  if (fs.existsSync(screenshotsDir)) {
    const files = fs.readdirSync(screenshotsDir, { recursive: true })
      .filter(file => file.endsWith('.png'))
      .slice(0, 10); // Mostrar apenas os primeiros 10
    
    if (files.length > 0) {
      log('\n📸 Screenshots gerados:', 'blue');
      files.forEach(file => {
        log(`   - ${file}`, 'green');
      });
      
      if (files.length === 10) {
        log('   ... e mais arquivos', 'yellow');
      }
    }
  }
}

function generateReport() {
  log('\n📊 Gerando Relatório de Testes Visuais...', 'blue');
  
  const reportHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Relatório de Testes Visuais - Humana Companions</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f8ff; padding: 20px; border-radius: 8px; }
        .section { margin: 20px 0; }
        .screenshot { margin: 10px; display: inline-block; }
        .screenshot img { max-width: 300px; border: 1px solid #ddd; border-radius: 4px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Relatório de Testes Visuais</h1>
        <p>Humana Companions - Sistema Administrativo</p>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
    </div>
    
    <div class="section">
        <h2>📸 Screenshots Capturados</h2>
        <div class="grid" id="screenshots-grid">
            <!-- Screenshots serão inseridos aqui -->
        </div>
    </div>
    
    <div class="section">
        <h2>📋 Comandos Úteis</h2>
        <pre>
# Executar todos os testes visuais
npm run test:visual

# Executar apenas testes admin
npm run test:visual admin

# Executar em múltiplos browsers
npm run test:visual cross-browser

# Executar testes mobile
npm run test:visual mobile

# Gerar relatório
npm run test:visual report
        </pre>
    </div>
</body>
</html>
  `;
  
  fs.writeFileSync('tests/screenshots/report.html', reportHtml);
  log('✅ Relatório gerado: tests/screenshots/report.html', 'green');
}

function updateBaselines() {
  log('\n🔄 Atualizando Baselines...', 'yellow');
  
  try {
    execSync('npx playwright test tests/e2e/visual-regression.test.ts --update-snapshots', {
      stdio: 'inherit'
    });
    log('✅ Baselines atualizados!', 'green');
  } catch (error) {
    log('❌ Erro ao atualizar baselines:', 'red');
    console.error(error.message);
  }
}

function showHelp() {
  log('\n🎯 Testes Visuais Automatizados - Humana Companions', 'blue');
  log('='.repeat(60), 'blue');
  log('\nComandos disponíveis:', 'yellow');
  log('  all           - Executar todos os testes (padrão)');
  log('  admin         - Executar apenas testes administrativos');
  log('  visual        - Executar apenas testes de regressão visual');
  log('  cross-browser - Executar em múltiplos browsers');
  log('  mobile        - Executar testes mobile');
  log('  report        - Gerar relatório HTML');
  log('  update        - Atualizar baselines');
  log('  help          - Mostrar esta ajuda');
  
  log('\nExemplos:', 'green');
  log('  node scripts/run-visual-tests.js');
  log('  node scripts/run-visual-tests.js admin');
  log('  node scripts/run-visual-tests.js visual');
  log('  node scripts/run-visual-tests.js report');
  
  log('\n📁 Estrutura de Screenshots:', 'blue');
  log('  tests/screenshots/           - Screenshots principais');
  log('  tests/screenshots/elements/  - Screenshots de elementos');
  log('  tests/screenshots/docs/      - Screenshots para documentação');
  log('  tests/screenshots/baselines/ - Baselines para comparação');
  log('  tests/screenshots/diffs/     - Diferenças detectadas');
}

// Processar argumentos da linha de comando
const args = process.argv.slice(2);
const command = args[0] || 'all';

switch (command) {
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  case 'report':
    generateReport();
    break;
  case 'update':
    updateBaselines();
    break;
  default:
    runTests(command);
} 