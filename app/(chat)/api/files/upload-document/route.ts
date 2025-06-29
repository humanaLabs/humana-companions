import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { document } from '@/lib/db/schema';
import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { getOrganizationId } from '@/lib/tenant-context';

// Schema de validação para upload
const uploadSchema = z.object({
  filename: z.string().min(1, 'Nome do arquivo é obrigatório'),
  fileType: z.string().min(1, 'Tipo do arquivo é obrigatório'),
  fileSize: z.number().min(1, 'Tamanho do arquivo deve ser maior que 0'),
});

// Tipos de arquivo suportados
const SUPPORTED_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'application/rtf': 'rtf',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
} as const;

// Limite de tamanho: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Função para extrair texto de PDF
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('Erro ao extrair texto do PDF:', error);
    throw new Error('Falha ao processar arquivo PDF');
  }
}

// Função para extrair texto de DOCX
async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Erro ao extrair texto do DOCX:', error);
    throw new Error('Falha ao processar arquivo DOCX');
  }
}

// Função para extrair texto de DOC (formato legado)
async function extractTextFromDoc(buffer: Buffer): Promise<string> {
  try {
    // Para arquivos DOC legado, tentamos usar mammoth mesmo assim
    // Em produção, seria melhor usar uma biblioteca específica como antiword
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Erro ao extrair texto do DOC:', error);
    // Se falhar, retornamos uma mensagem indicando que é um arquivo binário
    return '[Arquivo DOC - Visualização de texto não disponível. Conteúdo armazenado como arquivo binário.]';
  }
}

// Função principal de extração de texto
async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
  switch (mimeType) {
    case 'application/pdf':
      return await extractTextFromPdf(buffer);
    
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return await extractTextFromDocx(buffer);
    
    case 'application/msword':
      return await extractTextFromDoc(buffer);
    
    case 'text/plain':
    case 'text/markdown':
    case 'application/rtf':
      return buffer.toString('utf-8');
    
    case 'image/jpeg':
    case 'image/png':
    case 'image/gif':
    case 'image/webp':
      return `[Arquivo de imagem - ${mimeType}]`;
    
    default:
      return '[Tipo de arquivo não suportado para extração de texto]';
  }
}

// Função para determinar o kind do documento
function getDocumentKind(mimeType: string): 'text' | 'code' | 'image' | 'sheet' {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  
  if (mimeType === 'text/markdown' || mimeType.includes('code') || mimeType.includes('script')) {
    return 'code';
  }
  
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return 'sheet';
  }
  
  return 'text';
}

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    // Get organization ID from middleware headers
    const organizationId = await getOrganizationId();
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    if (!Object.keys(SUPPORTED_TYPES).includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'Tipo de arquivo não suportado',
          supportedTypes: Object.keys(SUPPORTED_TYPES),
          receivedType: file.type
        },
        { status: 400 }
      );
    }

    // Validar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: 'Arquivo muito grande',
          maxSize: MAX_FILE_SIZE,
          receivedSize: file.size
        },
        { status: 400 }
      );
    }

    // Validar dados do arquivo
    const fileData = {
      filename: file.name,
      fileType: file.type,
      fileSize: file.size,
    };

    const validatedData = uploadSchema.parse(fileData);

    // Converter arquivo para buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Extrair texto do arquivo
    let extractedText = '';
    try {
      extractedText = await extractTextFromFile(buffer, file.type);
    } catch (error) {
      console.warn('Aviso: Falha na extração de texto, continuando com upload:', error);
      extractedText = '[Texto não pôde ser extraído automaticamente]';
    }

    // Upload do arquivo original para Vercel Blob
    const blob = await put(
      `documents/${session.user.id}/${Date.now()}-${validatedData.filename}`,
      buffer,
      {
        access: 'public',
        contentType: file.type,
      }
    );

    // Determinar kind do documento
    const documentKind = getDocumentKind(file.type);

    // Salvar documento no banco de dados
    const [newDocument] = await db
      .insert(document)
      .values({
        title: validatedData.filename,
        content: extractedText,
        kind: documentKind,
        userId: session.user.id,
        organizationId,
        createdAt: new Date(),
      })
      .returning({
        id: document.id,
        title: document.title,
        content: document.content,
        kind: document.kind,
        createdAt: document.createdAt,
      });

    return NextResponse.json({
      success: true,
      document: newDocument,
      file: {
        name: validatedData.filename,
        type: validatedData.fileType,
        size: validatedData.fileSize,
        url: blob.url,
        extractedTextLength: extractedText.length,
      },
      message: 'Documento enviado e processado com sucesso',
    }, { status: 201 });

  } catch (error) {
    console.error('Erro no upload de documento:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados do arquivo inválidos', 
          details: error.errors.map(e => ({ 
            field: e.path.join('.'), 
            message: e.message 
          }))
        },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message.includes('processar arquivo')) {
      return NextResponse.json(
        { error: error.message },
        { status: 422 }
      );
    }
    
    return NextResponse.json(
      { error: 'Falha no upload do documento' },
      { status: 500 }
    );
  }
}

// GET - Informações sobre tipos de arquivo suportados
export async function GET() {
  return NextResponse.json({
    supportedTypes: Object.keys(SUPPORTED_TYPES),
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeMB: Math.round(MAX_FILE_SIZE / (1024 * 1024)),
    features: {
      textExtraction: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'text/markdown',
        'application/rtf'
      ],
      imageSupport: [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'image/webp'
      ]
    }
  });
} 