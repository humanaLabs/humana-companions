import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// Configurar ambiente Next.js
process.env.NODE_ENV = 'development';
process.env.NEXT_RUNTIME = 'nodejs';

// Executar o script
require('./update-master-admins.js');
