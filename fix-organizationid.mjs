import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const fixes = [
  {
    file: 'app/(chat)/api/chat/route.ts',
    replacements: [
      {
        search: 'chat = await getChatById({ id: chatId });',
        replace: `const organizationId = await getOrganizationId();
    if (!organizationId) {
      return new ChatSDKError('forbidden:chat', 'Organization context required').toResponse();
    }
    chat = await getChatById({ id: chatId, organizationId });`
      },
      {
        search: 'const chat = await getChatById({ id });',
        replace: `const organizationId = await getOrganizationId();
  if (!organizationId) {
    return new ChatSDKError('forbidden:chat', 'Organization context required').toResponse();
  }
  const chat = await getChatById({ id, organizationId });`
      },
      {
        search: 'const previousMessages = await getMessagesByChatId({ id });',
        replace: 'const previousMessages = await getMessagesByChatId({ id, organizationId });'
      },
      {
        search: 'const messages = await getMessagesByChatId({ id: chatId });',
        replace: 'const messages = await getMessagesByChatId({ id: chatId, organizationId });'
      }
    ]
  },
  {
    file: 'app/(chat)/api/vote/route.ts',
    replacements: [
      {
        search: 'const chat = await getChatById({ id: chatId });',
        replace: `const organizationId = await getOrganizationId();
  if (!organizationId) {
    return new ChatSDKError('forbidden:vote', 'Organization context required').toResponse();
  }
  const chat = await getChatById({ id: chatId, organizationId });`
      },
      {
        search: 'const votes = await getVotesByChatId({ id: chatId });',
        replace: 'const votes = await getVotesByChatId({ id: chatId, organizationId });'
      },
      {
        search: 'await voteMessage({\n    chatId,\n    messageId,\n    type: type,\n  });',
        replace: `await voteMessage({
    chatId,
    messageId,
    type: type,
    organizationId,
  });`
      }
    ]
  }
];

function fixFile(filePath, replacements) {
  try {
    let content = readFileSync(filePath, 'utf8');
    let changed = false;
    
    for (const { search, replace } of replacements) {
      if (content.includes(search)) {
        content = content.replace(search, replace);
        changed = true;
        console.log(`✅ Fixed in ${filePath}: ${search.slice(0, 50)}...`);
      }
    }
    
    if (changed) {
      // Add import if not present
      if (!content.includes("import { getOrganizationId }")) {
        const importPattern = /import.*from '@\/lib\/tenant-context';/;
        if (!importPattern.test(content)) {
          const firstImport = content.indexOf('import');
          if (firstImport !== -1) {
            const insertPos = content.indexOf('\n', firstImport) + 1;
            content = content.slice(0, insertPos) + 
              "import { getOrganizationId } from '@/lib/tenant-context';\n" + 
              content.slice(insertPos);
          }
        }
      }
      
      writeFileSync(filePath, content, 'utf8');
      console.log(`💾 Updated ${filePath}`);
    } else {
      console.log(`ℹ️  No changes needed in ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Apply fixes
for (const { file, replacements } of fixes) {
  fixFile(file, replacements);
}

console.log('🎉 All fixes applied!'); 