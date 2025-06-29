const fs = require('fs');

let content = fs.readFileSync('app/(chat)/api/chat/route.ts', 'utf8');

// Fix all organizationId issues systematically
const fixes = [
  // Line 138: getChatById needs organizationId  
  {
    from: /const chat = await getChatById\(\{ id \}\);/g,
    to: const organizationId = await getOrganizationId();
    if (!organizationId) {
      return new ChatSDKError('forbidden:chat', 'Organization context required').toResponse();
    }
    const chat = await getChatById({ id, organizationId });
  },
  
  // Line 157: getMessagesByChatId needs organizationId
  {
    from: /const previousMessages = await getMessagesByChatId\(\{ id \}\);/g,
    to: 'const previousMessages = await getMessagesByChatId({ id, organizationId });'
  },
  
  // Line 545: getChatById needs organizationId (different context)
  {
    from: /chat = await getChatById\(\{ id: chatId \}\);/g,
    to: const orgId = await getOrganizationId();
    if (!orgId) {
      return new ChatSDKError('forbidden:chat', 'Organization context required').toResponse();
    }
    chat = await getChatById({ id: chatId, organizationId: orgId });
  },
  
  // Line 584: getMessagesByChatId needs organizationId
  {
    from: /const messages = await getMessagesByChatId\(\{ id: chatId \}\);/g, 
    to: 'const messages = await getMessagesByChatId({ id: chatId, organizationId: orgId });'
  }
];

fixes.forEach(fix => {
  content = content.replace(fix.from, fix.to);
});

fs.writeFileSync('app/(chat)/api/chat/route.ts', content);
console.log('Fixed chat route organizationId issues');
