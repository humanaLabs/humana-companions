-- Migration 0020: Add LearnGen Protocol and University Core schema
-- Implements P0A User Adoption Foundation from the roadmap

-- LearnGen Protocol - User Cognitive Profile
CREATE TABLE "UserCognitiveProfile" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "organizationId" UUID REFERENCES "Organization"("id") ON DELETE CASCADE,
    
    -- Cognitive Style Assessment
    "primaryCognitiveStyle" VARCHAR(20) NOT NULL CHECK ("primaryCognitiveStyle" IN ('visual', 'auditory', 'kinesthetic', 'reading')),
    "secondaryCognitiveStyle" VARCHAR(20) CHECK ("secondaryCognitiveStyle" IN ('visual', 'auditory', 'kinesthetic', 'reading')),
    "adaptationLevel" VARCHAR(10) NOT NULL CHECK ("adaptationLevel" IN ('high', 'medium', 'low')),
    
    -- Experience Level
    "aiToolsExperience" VARCHAR(20) NOT NULL CHECK ("aiToolsExperience" IN ('novice', 'intermediate', 'advanced')),
    "businessContext" VARCHAR(20) NOT NULL CHECK ("businessContext" IN ('individual', 'team', 'organization')),
    "technicalSkills" VARCHAR(20) NOT NULL CHECK ("technicalSkills" IN ('basic', 'intermediate', 'advanced')),
    
    -- Learning Goals
    "primaryGoal" TEXT NOT NULL,
    "secondaryGoals" JSONB DEFAULT '[]',
    "timeframe" VARCHAR(20) NOT NULL CHECK ("timeframe" IN ('immediate', 'short-term', 'long-term')),
    
    -- Organizational Context
    "role" VARCHAR(100),
    "department" VARCHAR(100),
    "useCase" TEXT,
    "teamSize" INTEGER,
    
    "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
    
    -- Constraints
    UNIQUE("userId", "organizationId")
);

-- LearnGen Protocol - Onboarding Progress
CREATE TABLE "OnboardingProgress" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "organizationId" UUID REFERENCES "Organization"("id") ON DELETE CASCADE,
    
    -- Flow Progress
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "totalSteps" INTEGER NOT NULL,
    "completionRate" REAL NOT NULL DEFAULT 0 CHECK ("completionRate" >= 0 AND "completionRate" <= 100),
    
    -- Time Tracking
    "timeSpent" INTEGER NOT NULL DEFAULT 0, -- minutes
    "startedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
    "completedAt" TIMESTAMP,
    
    -- Adaptation Data
    "strugglingPoints" JSONB DEFAULT '[]',
    "adaptationEvents" JSONB DEFAULT '[]',
    "personalizedContent" JSONB DEFAULT '{}',
    
    -- Success Metrics
    "featureDiscoveryRate" REAL DEFAULT 0 CHECK ("featureDiscoveryRate" >= 0 AND "featureDiscoveryRate" <= 100),
    "interactionQuality" REAL DEFAULT 0 CHECK ("interactionQuality" >= 0 AND "interactionQuality" <= 100),
    "confidenceLevel" REAL DEFAULT 0 CHECK ("confidenceLevel" >= 0 AND "confidenceLevel" <= 100),
    
    "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
    
    -- Constraints
    UNIQUE("userId", "organizationId")
);

-- University - Learning Modules
CREATE TABLE "LearningModule" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organizationId" UUID REFERENCES "Organization"("id") ON DELETE CASCADE,
    
    -- Module Info
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "slug" VARCHAR(100) NOT NULL UNIQUE,
    "category" VARCHAR(50) NOT NULL CHECK ("category" IN ('getting-started', 'advanced-usage', 'troubleshooting', 'best-practices', 'enterprise')),
    
    -- Content
    "duration" INTEGER NOT NULL, -- minutes
    "difficultyLevel" VARCHAR(20) NOT NULL CHECK ("difficultyLevel" IN ('beginner', 'intermediate', 'advanced')),
    "learningObjectives" JSONB NOT NULL,
    
    -- Organization
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "prerequisites" JSONB DEFAULT '[]',
    
    "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- University - Learning Lessons
CREATE TABLE "LearningLesson" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "moduleId" UUID NOT NULL REFERENCES "LearningModule"("id") ON DELETE CASCADE,
    
    -- Lesson Info
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "slug" VARCHAR(100) NOT NULL,
    
    -- Content
    "type" VARCHAR(20) NOT NULL CHECK ("type" IN ('interactive', 'video', 'hands-on', 'quiz')),
    "duration" INTEGER NOT NULL, -- minutes
    "content" JSONB NOT NULL,
    
    -- Learning Design
    "learningObjectives" JSONB NOT NULL,
    "interactiveElements" JSONB DEFAULT '[]',
    "assessmentQuestions" JSONB DEFAULT '[]',
    
    -- Organization
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    
    "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
    
    -- Constraints
    UNIQUE("moduleId", "slug")
);

-- University - User Progress table already exists from previous migration
-- Skipping table creation to avoid conflicts

-- University - Certifications
CREATE TABLE "UserCertification" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "organizationId" UUID REFERENCES "Organization"("id") ON DELETE CASCADE,
    "moduleId" UUID NOT NULL REFERENCES "LearningModule"("id") ON DELETE CASCADE,
    
    -- Certification Details
    "certificateTitle" VARCHAR(200) NOT NULL,
    "issuer" VARCHAR(100) NOT NULL DEFAULT 'Humana AI University',
    "certificateId" VARCHAR(50) NOT NULL UNIQUE,
    
    -- Scoring
    "finalScore" REAL NOT NULL CHECK ("finalScore" >= 0 AND "finalScore" <= 100),
    "passingScore" REAL NOT NULL DEFAULT 80 CHECK ("passingScore" >= 0 AND "passingScore" <= 100),
    
    -- Validity
    "issuedAt" TIMESTAMP DEFAULT NOW() NOT NULL,
    "validUntil" TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Branding (for organizations)
    "customBranding" JSONB DEFAULT '{}',
    
    "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- University - Community Forums
CREATE TABLE "CommunityForum" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organizationId" UUID REFERENCES "Organization"("id") ON DELETE CASCADE,
    
    -- Forum Info
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "slug" VARCHAR(100) NOT NULL UNIQUE,
    "category" VARCHAR(50) NOT NULL CHECK ("category" IN ('getting-started', 'advanced-usage', 'troubleshooting', 'best-practices')),
    
    -- Organization
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    
    "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- University - Forum Posts
CREATE TABLE "ForumPost" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "forumId" UUID NOT NULL REFERENCES "CommunityForum"("id") ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "organizationId" UUID REFERENCES "Organization"("id") ON DELETE CASCADE,
    "parentPostId" UUID REFERENCES "ForumPost"("id") ON DELETE CASCADE,
    
    -- Post Content
    "title" VARCHAR(200),
    "content" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL DEFAULT 'discussion' CHECK ("type" IN ('discussion', 'question', 'answer')),
    
    -- Engagement
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    
    -- Moderation
    "isApproved" BOOLEAN NOT NULL DEFAULT TRUE,
    "isHidden" BOOLEAN NOT NULL DEFAULT FALSE,
    
    "createdAt" TIMESTAMP DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add indexes for performance
CREATE INDEX "UserCognitiveProfile_userId_idx" ON "UserCognitiveProfile"("userId");
CREATE INDEX "UserCognitiveProfile_organizationId_idx" ON "UserCognitiveProfile"("organizationId");

CREATE INDEX "OnboardingProgress_userId_idx" ON "OnboardingProgress"("userId");
CREATE INDEX "OnboardingProgress_organizationId_idx" ON "OnboardingProgress"("organizationId");
CREATE INDEX "OnboardingProgress_completionRate_idx" ON "OnboardingProgress"("completionRate");

CREATE INDEX "LearningModule_category_idx" ON "LearningModule"("category");
CREATE INDEX "LearningModule_organizationId_isActive_idx" ON "LearningModule"("organizationId", "isActive");
CREATE INDEX "LearningModule_sortOrder_idx" ON "LearningModule"("sortOrder");

CREATE INDEX "LearningLesson_moduleId_sortOrder_idx" ON "LearningLesson"("moduleId", "sortOrder");
CREATE INDEX "LearningLesson_type_idx" ON "LearningLesson"("type");

CREATE INDEX "UserLearningProgress_userId_status_idx" ON "UserLearningProgress"("userId", "status");
CREATE INDEX "UserLearningProgress_organizationId_idx" ON "UserLearningProgress"("organizationId");
CREATE INDEX "UserLearningProgress_moduleId_idx" ON "UserLearningProgress"("moduleId");

CREATE INDEX "UserCertification_userId_idx" ON "UserCertification"("userId");
CREATE INDEX "UserCertification_organizationId_idx" ON "UserCertification"("organizationId");
CREATE INDEX "UserCertification_isActive_idx" ON "UserCertification"("isActive");

CREATE INDEX "CommunityForum_category_isActive_idx" ON "CommunityForum"("category", "isActive");
CREATE INDEX "CommunityForum_organizationId_idx" ON "CommunityForum"("organizationId");

CREATE INDEX "ForumPost_forumId_createdAt_idx" ON "ForumPost"("forumId", "createdAt" DESC);
CREATE INDEX "ForumPost_userId_idx" ON "ForumPost"("userId");
CREATE INDEX "ForumPost_parentPostId_idx" ON "ForumPost"("parentPostId");
CREATE INDEX "ForumPost_organizationId_idx" ON "ForumPost"("organizationId");

-- Insert default learning modules for Getting Started track
INSERT INTO "LearningModule" ("id", "title", "description", "slug", "category", "duration", "difficultyLevel", "learningObjectives", "sortOrder") VALUES
(
    gen_random_uuid(),
    'AI Companions Fundamentals',
    'Learn the basics of AI Companions and how they can enhance your productivity',
    'ai-companions-fundamentals',
    'getting-started',
    60,
    'beginner',
    '["Understanding AI Companions", "Basic interaction patterns", "Productivity benefits"]',
    1
);

-- Insert default lessons for the fundamentals module
DO $$
DECLARE
    fundamentals_module_id UUID;
BEGIN
    SELECT id INTO fundamentals_module_id FROM "LearningModule" WHERE slug = 'ai-companions-fundamentals';
    
    INSERT INTO "LearningLesson" ("moduleId", "title", "description", "slug", "type", "duration", "content", "learningObjectives", "sortOrder") VALUES
    (
        fundamentals_module_id,
        'Understanding AI Companions',
        'Introduction to AI Companions and their capabilities',
        'understanding-ai-companions',
        'interactive',
        15,
        '{"sections": [{"title": "What are AI Companions", "content": "AI Companions are intelligent assistants..."}, {"title": "Key Capabilities", "content": "They can help with..."}, {"title": "Getting Started", "content": "Let''s begin..."}]}',
        '["Define AI Companions", "Identify key capabilities", "Understand use cases"]',
        1
    ),
    (
        fundamentals_module_id,
        'Your First Conversation',
        'Learn how to have effective conversations with AI Companions',
        'your-first-conversation',
        'hands-on',
        15,
        '{"sections": [{"title": "Starting a Conversation", "content": "Click on..."}, {"title": "Asking Questions", "content": "Best practices..."}, {"title": "Understanding Responses", "content": "How to interpret..."}]}',
        '["Start conversations", "Ask effective questions", "Interpret responses"]',
        2
    ),
    (
        fundamentals_module_id,
        'Document Integration',
        'Upload and work with documents using AI Companions',
        'document-integration',
        'hands-on',
        15,
        '{"sections": [{"title": "Uploading Documents", "content": "Drag and drop..."}, {"title": "Asking About Content", "content": "Query your documents..."}, {"title": "Building Knowledge", "content": "Create your knowledge base..."}]}',
        '["Upload documents", "Query document content", "Build knowledge base"]',
        3
    ),
    (
        fundamentals_module_id,
        'Advanced Features',
        'Explore specialized companions and advanced features',
        'advanced-features',
        'interactive',
        15,
        '{"sections": [{"title": "Specialized Companions", "content": "Different types..."}, {"title": "Collaboration", "content": "Working with teams..."}, {"title": "Customization", "content": "Personalizing your experience..."}]}',
        '["Use specialized companions", "Collaborate effectively", "Customize experience"]',
        4
    );
END $$;

-- Insert default community forums
INSERT INTO "CommunityForum" ("title", "description", "slug", "category", "sortOrder") VALUES
('Getting Started', 'Help and support for new users', 'getting-started', 'getting-started', 1),
('Advanced Usage', 'Advanced tips and techniques', 'advanced-usage', 'advanced-usage', 2),
('Troubleshooting', 'Technical support and problem solving', 'troubleshooting', 'troubleshooting', 3),
('Best Practices', 'Share your best practices and workflows', 'best-practices', 'best-practices', 4);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_cognitive_profile_updated_at BEFORE UPDATE ON "UserCognitiveProfile" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_onboarding_progress_updated_at BEFORE UPDATE ON "OnboardingProgress" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_module_updated_at BEFORE UPDATE ON "LearningModule" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_lesson_updated_at BEFORE UPDATE ON "LearningLesson" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_learning_progress_updated_at BEFORE UPDATE ON "UserLearningProgress" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_certification_updated_at BEFORE UPDATE ON "UserCertification" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_community_forum_updated_at BEFORE UPDATE ON "CommunityForum" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_post_updated_at BEFORE UPDATE ON "ForumPost" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 