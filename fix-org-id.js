const fs = require('fs');

const files = [
  'app/(chat)/api/suggestions/route.ts',
  'artifacts/actions.ts', 
  'lib/ai/tools/request-suggestions.ts',
  'lib/ai/tools/update-document.ts'
];

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;
    
    // Add import if not present
    if (!content.includes('getOrganizationId')) {
      const lines = content.split('\n');
      let insertIndex = -1;
      
      // Find the line after the last import
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ')) {
          insertIndex = i + 1;
        }
      }
      
      if (insertIndex > -1) {
        lines.splice(insertIndex, 0, "import { getOrganizationId } from '@/lib/tenant-context';");
        content = lines.join('\n');
        changed = true;
      }
    }
    
    // Fix getSuggestionsByDocumentId calls
    if (content.includes('getSuggestionsByDocumentId({')) {
      content = content.replace(
        /getSuggestionsByDocumentId\(\{\s*documentId[,\s]*\}\)/g,
        'getSuggestionsByDocumentId({ documentId, organizationId })'
      );
      changed = true;
    }
    
    // Fix getDocumentById calls
    if (content.includes('getDocumentById({')) {
      content = content.replace(
        /getDocumentById\(\{\s*id[,\s]*\}\)/g,
        'getDocumentById({ id, organizationId })'
      );
      content = content.replace(
        /getDocumentById\(\{\s*id:\s*(\w+)[,\s]*\}\)/g,
        'getDocumentById({ id: $1, organizationId })'
      );
      changed = true;
    }
    
    if (changed) {
      fs.writeFileSync(file, content);
      console.log('✅ Fixed:', file);
    } else {
      console.log('ℹ️  No changes needed in:', file);
    }
  } catch (err) {
    console.log('❌ Error with', file + ':', err.message);
  }
});

console.log('🎉 All fixes completed!'); 