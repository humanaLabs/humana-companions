const fs = require('fs');

function fixFile(filePath, fixes) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;
    
    fixes.forEach(fix => {
      content = content.replace(fix.from, fix.to);
    });
    
    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log('✅ Fixed:', filePath);
    } else {
      console.log('ℹ️  No changes needed:', filePath);
    }
  } catch (err) {
    console.log('❌ Error:', filePath, err.message);
  }
}

// Fix artifacts/actions.ts
fixFile('artifacts/actions.ts', [
  {
    from: `import { getSuggestionsByDocumentId } from '@/lib/db/queries';`,
    to: `import { getSuggestionsByDocumentId } from '@/lib/db/queries';
import { getOrganizationId } from '@/lib/tenant-context';`
  },
  {
    from: `export async function getSuggestions({ documentId }: { documentId: string }) {
  const suggestions = await getSuggestionsByDocumentId({ documentId });
  return suggestions ?? [];
}`,
    to: `export async function getSuggestions({ documentId }: { documentId: string }) {
  const organizationId = await getOrganizationId();
  if (!organizationId) {
    throw new Error('Organization context required');
  }
  
  const suggestions = await getSuggestionsByDocumentId({ documentId, organizationId });
  return suggestions ?? [];
}`
  }
]);

console.log('🎉 Done!'); 