import { readFileSync, writeFileSync } from 'fs';

// Simple fixes for critical API errors
const filesToFix = [
  'app/(chat)/api/chat/route.ts',
  'app/(chat)/api/vote/route.ts',
  'app/(chat)/chat/[id]/page.tsx',
  'app/(chat)/actions.ts'
];

function addOrganizationIdParam(content, functionName) {
  // Replace function calls that are missing organizationId
  const patterns = [
    {
      search: new RegExp(`${functionName}\\(\\{\\s*id\\s*\\}\\)`, 'g'),
      replace: `${functionName}({ id, organizationId })`
    },
    {
      search: new RegExp(`${functionName}\\(\\{\\s*id:\\s*(\\w+)\\s*\\}\\)`, 'g'),
      replace: `${functionName}({ id: $1, organizationId })`
    }
  ];
  
  let result = content;
  for (const pattern of patterns) {
    result = result.replace(pattern.search, pattern.replace);
  }
  return result;
}

function fixFile(filePath) {
  try {
    let content = readFileSync(filePath, 'utf8');
    const original = content;
    
    // Add organizationId to database calls
    content = addOrganizationIdParam(content, 'getChatById');
    content = addOrganizationIdParam(content, 'getMessagesByChatId');
    content = addOrganizationIdParam(content, 'getVotesByChatId');
    content = addOrganizationIdParam(content, 'getDocumentById');
    content = addOrganizationIdParam(content, 'getMessageById');
    content = addOrganizationIdParam(content, 'getSuggestionsByDocumentId');
    
    if (content !== original) {
      writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${filePath}`);
    } else {
      console.log(`ℹ️  No changes needed in ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error with ${filePath}:`, error.message);
  }
}

// Fix all files
filesToFix.forEach(fixFile);
console.log('🎉 Fixes completed!'); 