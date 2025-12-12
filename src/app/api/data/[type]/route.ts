import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const SITE_PASSWORD = process.env.SITE_PASSWORD || 'demo2025';

// Map of allowed data types to their file paths
const dataFiles: Record<string, string> = {
  'article': 'article.json',
  'claims': 'claims.json',
  'claims-vague': 'claims_vague.json',
  'grok-comparison': 'grok-comparison.json',
  'explainable-news': 'explainable-news.json',
  'wikidata-cache': 'wikidata-cache.json',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  // Backup auth check - middleware should handle this, but defense in depth
  const authCookie = request.cookies.get('site-auth');
  if (authCookie?.value !== SITE_PASSWORD) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const { type } = await params;

  const fileName = dataFiles[type];
  
  if (!fileName) {
    return NextResponse.json(
      { error: 'Invalid data type' },
      { status: 400 }
    );
  }

  try {
    const filePath = path.join(process.cwd(), 'src', 'data', fileName);
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContents);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error reading data file ${fileName}:`, error);
    return NextResponse.json(
      { error: 'Failed to load data' },
      { status: 500 }
    );
  }
}

