import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { document } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().min(1, 'Query de busca é obrigatória').max(500, 'Query muito longa'),
  organizationId: z.string().uuid().optional(),
  kind: z.enum(['text', 'code', 'image', 'sheet']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// GET /api/documents/search - Busca full-text nos documentos
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      query: searchParams.get('query') || '',
      organizationId: searchParams.get('organizationId'),
      kind: searchParams.get('kind'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    };

    const validatedParams = searchSchema.parse(queryParams);

    // Preparar a query de busca full-text
    const searchQuery = validatedParams.query
      .trim()
      .split(/\s+/)
      .map(term => `${term}:*`)
      .join(' & ');

    // Executar busca com PostgreSQL full-text search
    const results = await db
      .select({
        id: document.id,
        title: document.title,
        content: document.content,
        kind: document.kind,
        createdAt: document.createdAt,
        rank: sql<number>`ts_rank_cd(
          to_tsvector('portuguese', ${document.title} || ' ' || COALESCE(${document.content}, '')),
          plainto_tsquery('portuguese', ${validatedParams.query})
        )`,
        snippet: sql<string>`ts_headline(
          'portuguese',
          COALESCE(${document.content}, ${document.title}),
          plainto_tsquery('portuguese', ${validatedParams.query}),
          'MaxWords=50, MinWords=10, ShortWord=3, HighlightAll=false, MaxFragments=3'
        )`,
      })
      .from(document)
      .where(
        and(
          eq(document.userId, session.user.id),
          // TODO: Adicionar organizationId quando schema for normalizado
          // validatedParams.organizationId 
          //   ? eq(document.organizationId, validatedParams.organizationId)
          //   : undefined,
          validatedParams.kind 
            ? eq(document.kind, validatedParams.kind)
            : undefined,
          sql`to_tsvector('portuguese', ${document.title} || ' ' || COALESCE(${document.content}, '')) @@ plainto_tsquery('portuguese', ${validatedParams.query})`
        )
      )
      .orderBy(sql`ts_rank_cd(
        to_tsvector('portuguese', ${document.title} || ' ' || COALESCE(${document.content}, '')),
        plainto_tsquery('portuguese', ${validatedParams.query})
      ) DESC`)
      .limit(validatedParams.limit)
      .offset(validatedParams.offset);

    // Contar total de resultados para paginação
    const [countResult] = await db
      .select({
        total: sql<number>`count(*)`
      })
      .from(document)
      .where(
        and(
          eq(document.userId, session.user.id),
          validatedParams.kind 
            ? eq(document.kind, validatedParams.kind)
            : undefined,
          sql`to_tsvector('portuguese', ${document.title} || ' ' || COALESCE(${document.content}, '')) @@ plainto_tsquery('portuguese', ${validatedParams.query})`
        )
      );

    return NextResponse.json({
      results: results.map(result => ({
        id: result.id,
        title: result.title,
        content: result.content,
        kind: result.kind,
        createdAt: result.createdAt,
        relevanceScore: result.rank,
        snippet: result.snippet,
      })),
      pagination: {
        total: countResult?.total || 0,
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        hasMore: (countResult?.total || 0) > (validatedParams.offset + validatedParams.limit),
      },
      searchQuery: validatedParams.query,
    });
  } catch (error) {
    console.error('Erro na busca de documentos:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Parâmetros de busca inválidos', 
          details: error.errors.map(e => ({ 
            field: e.path.join('.'), 
            message: e.message 
          }))
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Falha na busca de documentos' },
      { status: 500 }
    );
  }
}

// POST /api/documents/search - Busca com filtros avançados
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedParams = searchSchema.parse(body);

    // Preparar query mais sofisticada para busca por POST
    const searchTerms = validatedParams.query
      .trim()
      .split(/\s+/)
      .filter(term => term.length > 2); // Filtrar termos muito curtos

    if (searchTerms.length === 0) {
      return NextResponse.json(
        { error: 'Query de busca deve conter pelo menos um termo com 3+ caracteres' },
        { status: 400 }
      );
    }

    // Construir query tsquery mais robusta
    const tsQuery = searchTerms
      .map(term => `${term}:*`)
      .join(' & ');

    const results = await db
      .select({
        id: document.id,
        title: document.title,
        content: document.content,
        kind: document.kind,
        createdAt: document.createdAt,
        rank: sql<number>`ts_rank_cd(
          setweight(to_tsvector('portuguese', ${document.title}), 'A') ||
          setweight(to_tsvector('portuguese', COALESCE(${document.content}, '')), 'B'),
          to_tsquery('portuguese', ${tsQuery})
        )`,
        snippet: sql<string>`ts_headline(
          'portuguese',
          COALESCE(${document.content}, ${document.title}),
          to_tsquery('portuguese', ${tsQuery}),
          'MaxWords=100, MinWords=10, ShortWord=3, HighlightAll=false, MaxFragments=5'
        )`,
      })
      .from(document)
      .where(
        and(
          eq(document.userId, session.user.id),
          validatedParams.kind 
            ? eq(document.kind, validatedParams.kind)
            : undefined,
          sql`(
            setweight(to_tsvector('portuguese', ${document.title}), 'A') ||
            setweight(to_tsvector('portuguese', COALESCE(${document.content}, '')), 'B')
          ) @@ to_tsquery('portuguese', ${tsQuery})`
        )
      )
      .orderBy(sql`ts_rank_cd(
        setweight(to_tsvector('portuguese', ${document.title}), 'A') ||
        setweight(to_tsvector('portuguese', COALESCE(${document.content}, '')), 'B'),
        to_tsquery('portuguese', ${tsQuery})
      ) DESC`)
      .limit(validatedParams.limit)
      .offset(validatedParams.offset);

    // Contar total
    const [countResult] = await db
      .select({
        total: sql<number>`count(*)`
      })
      .from(document)
      .where(
        and(
          eq(document.userId, session.user.id),
          validatedParams.kind 
            ? eq(document.kind, validatedParams.kind)
            : undefined,
          sql`(
            setweight(to_tsvector('portuguese', ${document.title}), 'A') ||
            setweight(to_tsvector('portuguese', COALESCE(${document.content}, '')), 'B')
          ) @@ to_tsquery('portuguese', ${tsQuery})`
        )
      );

    return NextResponse.json({
      results: results.map(result => ({
        id: result.id,
        title: result.title,
        content: result.content,
        kind: result.kind,
        createdAt: result.createdAt,
        relevanceScore: result.rank,
        snippet: result.snippet,
      })),
      pagination: {
        total: countResult?.total || 0,
        limit: validatedParams.limit,
        offset: validatedParams.offset,
        hasMore: (countResult?.total || 0) > (validatedParams.offset + validatedParams.limit),
      },
      searchQuery: validatedParams.query,
      searchTerms: searchTerms,
    });
  } catch (error) {
    console.error('Erro na busca avançada de documentos:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Parâmetros de busca inválidos', 
          details: error.errors.map(e => ({ 
            field: e.path.join('.'), 
            message: e.message 
          }))
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Falha na busca avançada de documentos' },
      { status: 500 }
    );
  }
} 