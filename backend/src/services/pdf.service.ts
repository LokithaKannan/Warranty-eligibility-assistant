import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { env } from '../config/env';
import { computeFileHash, generateStoredFilename, sanitizeFilenameForDisplay } from '../utils/crypto';
import { logger } from '../utils/logger';
import { ExtractionStatus } from '../types';

export interface PageText {
  pageNumber: number;
  text: string;
}

export interface PdfExtractionResult {
  storedFilename: string;
  fileHash: string;
  originalFilename: string;
  status: ExtractionStatus;
  totalPages: number;
  pages: PageText[];
  fullText: string;
  message?: string;
}

// Minimum meaningful characters per page to consider it text-based
const MIN_TEXT_CHARS = 50;
const MIN_TOTAL_CHARS = 100;

export async function extractPdfText(
  fileBuffer: Buffer,
  originalFilename: string
): Promise<PdfExtractionResult> {
  const safeOriginalFilename = sanitizeFilenameForDisplay(originalFilename);
  const fileHash = computeFileHash(fileBuffer);
  const storedFilename = generateStoredFilename('.pdf');

  // Ensure uploads directory exists
  const uploadsDir = path.resolve(env.UPLOADS_DIR);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const storedPath = path.join(uploadsDir, storedFilename);

  // Validate PDF magic bytes: %PDF
  if (
    fileBuffer.length < 4 ||
    fileBuffer[0] !== 0x25 || // %
    fileBuffer[1] !== 0x50 || // P
    fileBuffer[2] !== 0x44 || // D
    fileBuffer[3] !== 0x46    // F
  ) {
    throw new Error('File does not appear to be a valid PDF (invalid magic bytes)');
  }

  // Save to uploads directory with random name
  fs.writeFileSync(storedPath, fileBuffer);
  logger.info('PDF saved to uploads', { storedFilename, originalFilename: safeOriginalFilename });

  let pdfData: Awaited<ReturnType<typeof pdfParse>>;
  try {
    pdfData = await pdfParse(fileBuffer, {
      // Render page-by-page text
      pagerender: renderPage,
    });
  } catch (err) {
    logger.error('PDF parsing failed', { error: String(err), storedFilename });
    return {
      storedFilename,
      fileHash,
      originalFilename: safeOriginalFilename,
      status: 'FAILED',
      totalPages: 0,
      pages: [],
      fullText: '',
      message: `PDF parsing failed: ${String(err)}`,
    };
  }

  const totalPages = pdfData.numpages;

  // Check if text was actually extracted
  const fullText = pdfData.text || '';
  const trimmedText = fullText.replace(/\s+/g, ' ').trim();

  if (trimmedText.length < MIN_TOTAL_CHARS) {
    logger.warn('PDF appears to be scanned or empty', { storedFilename, textLength: trimmedText.length });
    return {
      storedFilename,
      fileHash,
      originalFilename: safeOriginalFilename,
      status: 'NEEDS_OCR',
      totalPages,
      pages: [],
      fullText: '',
      message:
        'This PDF appears to be a scanned image. OCR processing is required to extract text. ' +
        'Please use a text-based PDF or enable OCR processing.',
    };
  }

  // Split text into pages using the rendered pages array
  const pages = splitTextIntoPages(pdfData, totalPages);

  logger.info('PDF extracted successfully', {
    storedFilename,
    totalPages,
    textLength: trimmedText.length,
  });

  return {
    storedFilename,
    fileHash,
    originalFilename: safeOriginalFilename,
    status: 'EXTRACTED',
    totalPages,
    pages,
    fullText: trimmedText,
  };
}

// Custom page renderer to get per-page text
const pageTexts: string[] = [];

function renderPage(pageData: any): string {
  // This function is called per page by pdf-parse
  return pageData.getTextContent().then((textContent: any) => {
    const text = textContent.items.map((item: any) => item.str).join(' ');
    pageTexts.push(text);
    return text;
  });
}

function splitTextIntoPages(pdfData: any, totalPages: number): PageText[] {
  const pages: PageText[] = [];

  // pdf-parse provides full text; we split by form feed or estimate
  const rawText = pdfData.text || '';

  // pdf-parse separates pages with \f (form feed character)
  const pageParts = rawText.split('\f');

  for (let i = 0; i < totalPages; i++) {
    const rawPageText = pageParts[i] ?? '';
    const normalizedText = normalizeWhitespace(rawPageText);
    pages.push({
      pageNumber: i + 1,
      text: normalizedText,
    });
  }

  return pages;
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function deleteUploadedFile(storedFilename: string): void {
  try {
    const filePath = path.join(path.resolve(env.UPLOADS_DIR), storedFilename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info('Deleted uploaded file', { storedFilename });
    }
  } catch (err) {
    logger.warn('Could not delete uploaded file', { storedFilename, error: String(err) });
  }
}
