import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db';
import { 
  getChatById,
  getMessagesByChatId,
  voteMessage,
  getVotesByChatId,
  getDocumentById,
  getDocumentsById,
  getSuggestionsByDocumentId,
  getMessageById
} from '@/lib/db/queries';
import { chat, message, vote, document, suggestion } from '@/lib/db/schema';
import { generateUUID } from '@/lib/utils';

describe('🔒 Database Security - Tenant Isolation Tests', () => {
  let org1Id: string;
  let org2Id: string;
  let user1Id: string;
  let user2Id: string;
  let chat1Id: string;
  let chat2Id: string;
  let message1Id: string;
  let message2Id: string;
  let doc1Id: string;
  let doc2Id: string;

  beforeEach(async () => {
    // Setup test data for two different organizations
    org1Id = generateUUID();
    org2Id = generateUUID();
    user1Id = generateUUID();
    user2Id = generateUUID();
    chat1Id = generateUUID();
    chat2Id = generateUUID();
    message1Id = generateUUID();
    message2Id = generateUUID();
    doc1Id = generateUUID();
    doc2Id = generateUUID();

    // Create test chats for each organization
    await db.insert(chat).values([
      {
        id: chat1Id,
        userId: user1Id,
        organizationId: org1Id,
        title: 'Org1 Chat',
        visibility: 'private',
        createdAt: new Date(),
      },
      {
        id: chat2Id,
        userId: user2Id,
        organizationId: org2Id,
        title: 'Org2 Chat',
        visibility: 'private',
        createdAt: new Date(),
      }
    ]);

    // Create test messages for each organization
    await db.insert(message).values([
      {
        id: message1Id,
        chatId: chat1Id,
        organizationId: org1Id,
        role: 'user',
        parts: [{ type: 'text', text: 'Org1 message' }],
        attachments: [],
        createdAt: new Date(),
      },
      {
        id: message2Id,
        chatId: chat2Id,
        organizationId: org2Id,
        role: 'user',
        parts: [{ type: 'text', text: 'Org2 message' }],
        attachments: [],
        createdAt: new Date(),
      }
    ]);

    // Create test documents for each organization
    await db.insert(document).values([
      {
        id: doc1Id,
        userId: user1Id,
        organizationId: org1Id,
        title: 'Org1 Document',
        kind: 'text',
        content: 'Sensitive Org1 content',
        createdAt: new Date(),
      },
      {
        id: doc2Id,
        userId: user2Id,
        organizationId: org2Id,
        title: 'Org2 Document',
        kind: 'text',
        content: 'Sensitive Org2 content',
        createdAt: new Date(),
      }
    ]);
  });

  afterEach(async () => {
    // Cleanup test data
    await db.delete(vote).where(vote.chatId.in([chat1Id, chat2Id]));
    await db.delete(message).where(message.chatId.in([chat1Id, chat2Id]));
    await db.delete(chat).where(chat.id.in([chat1Id, chat2Id]));
    await db.delete(document).where(document.id.in([doc1Id, doc2Id]));
  });

  describe('🚨 Cross-Tenant Access Prevention', () => {
    it('should prevent getChatById cross-tenant access', async () => {
      // ✅ Valid access - same organization
      const validChat = await getChatById({ id: chat1Id, organizationId: org1Id });
      expect(validChat).toBeDefined();
      expect(validChat?.id).toBe(chat1Id);

      // 🚨 Invalid access - different organization
      const invalidChat = await getChatById({ id: chat1Id, organizationId: org2Id });
      expect(invalidChat).toBeUndefined();
    });

    it('should prevent getMessagesByChatId cross-tenant access', async () => {
      // ✅ Valid access - same organization
      const validMessages = await getMessagesByChatId({ id: chat1Id, organizationId: org1Id });
      expect(validMessages).toHaveLength(1);
      expect(validMessages[0].id).toBe(message1Id);

      // 🚨 Invalid access - different organization
      const invalidMessages = await getMessagesByChatId({ id: chat1Id, organizationId: org2Id });
      expect(invalidMessages).toHaveLength(0);
    });

    it('should prevent getDocumentById cross-tenant access', async () => {
      // ✅ Valid access - same organization
      const validDoc = await getDocumentById({ id: doc1Id, organizationId: org1Id });
      expect(validDoc).toBeDefined();
      expect(validDoc?.content).toBe('Sensitive Org1 content');

      // 🚨 Invalid access - different organization
      const invalidDoc = await getDocumentById({ id: doc1Id, organizationId: org2Id });
      expect(invalidDoc).toBeUndefined();
    });

    it('should prevent vote manipulation across organizations', async () => {
      // ✅ Valid vote - same organization
      await expect(voteMessage({
        chatId: chat1Id,
        messageId: message1Id,
        type: 'up',
        organizationId: org1Id
      })).resolves.not.toThrow();

      // 🚨 Invalid vote - different organization (should fail)
      await expect(voteMessage({
        chatId: chat1Id,
        messageId: message1Id,
        type: 'up',
        organizationId: org2Id
      })).rejects.toThrow();
    });

    it('should prevent getVotesByChatId cross-tenant access', async () => {
      // Setup a vote for org1
      await voteMessage({
        chatId: chat1Id,
        messageId: message1Id,
        type: 'up',
        organizationId: org1Id
      });

      // ✅ Valid access - same organization
      const validVotes = await getVotesByChatId({ id: chat1Id, organizationId: org1Id });
      expect(validVotes).toHaveLength(1);

      // 🚨 Invalid access - different organization
      const invalidVotes = await getVotesByChatId({ id: chat1Id, organizationId: org2Id });
      expect(invalidVotes).toHaveLength(0);
    });
  });

  describe('📊 Performance Impact Tests', () => {
    it('should maintain query performance with organizationId filters', async () => {
      const startTime = performance.now();
      
      await getChatById({ id: chat1Id, organizationId: org1Id });
      await getMessagesByChatId({ id: chat1Id, organizationId: org1Id });
      await getDocumentById({ id: doc1Id, organizationId: org1Id });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Performance should be under 50ms
      expect(executionTime).toBeLessThan(50);
    });
  });

  describe('🛡️ Edge Cases & Attack Vectors', () => {
    it('should handle malicious organizationId injection attempts', async () => {
      const maliciousIds = [
        null,
        undefined,
        '',
        'null',
        'undefined',
        '1; DROP TABLE chat; --',
        '\'OR 1=1--',
        'admin',
        '00000000-0000-0000-0000-000000000000'
      ];

      for (const maliciousId of maliciousIds) {
        // All should fail gracefully
        const result = await getChatById({ 
          id: chat1Id, 
          organizationId: maliciousId as string 
        });
        expect(result).toBeUndefined();
      }
    });

    it('should prevent enumeration attacks', async () => {
      // Attacker tries to enumerate valid IDs with wrong organization
      const attempts = [chat1Id, chat2Id, 'fake-id', generateUUID()];
      
      for (const attemptId of attempts) {
        const result = await getChatById({ 
          id: attemptId, 
          organizationId: org2Id 
        });
        
        if (attemptId === chat2Id) {
          expect(result).toBeDefined(); // Only org2's own chat should be accessible
        } else {
          expect(result).toBeUndefined(); // All others should be blocked
        }
      }
    });
  });
});

export default {
  name: 'Database Security Test Suite',
  description: 'Validates tenant isolation at database level',
  coverage: [
    'getChatById',
    'getMessagesByChatId', 
    'voteMessage',
    'getVotesByChatId',
    'getDocumentById',
    'Cross-tenant prevention',
    'Performance impact',
    'Attack vector protection'
  ]
}; 