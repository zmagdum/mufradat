/**
 * Import Vocabulary Data Script
 * 
 * This script imports books, chapters, and vocabulary words from CSV files into DynamoDB.
 * 
 * Default file locations:
 * - backend/data/books.csv (book and chapter information)
 * - backend/data/words.csv (vocabulary words)
 * 
 * Usage:
 *   npm run import:vocabulary
 *   npm run import:vocabulary -- --book 1
 *   npm run import:vocabulary -- --dry-run
 *   npm run import:vocabulary -- --books-file path/to/books.csv --words-file path/to/words.csv
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { PutCommand, BatchWriteCommand, ScanCommand, QueryCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { v4 as uuid } from 'uuid';

// Load .env file if it exists
function loadEnvFile() {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          const cleanValue = value.replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = cleanValue;
          }
        }
      }
    });
  }
}

// Load environment variables
loadEnvFile();

// Configuration - use .env values if available
const VOCABULARY_TABLE_NAME = process.env.VOCABULARY_TABLE_NAME || 'mufradat-vocabulary-local';
const BOOKS_TABLE_NAME = process.env.BOOKS_TABLE_NAME || 'mufradat-books-local';
const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const AWS_ENDPOINT = process.env.AWS_ENDPOINT || process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
const MEDIA_BUCKET_NAME = process.env.MEDIA_BUCKET_NAME || 'mufradat-media-local';
const S3_BASE_URL = process.env.S3_BASE_URL || 
  (process.env.AWS_ENDPOINT 
    ? `http://${MEDIA_BUCKET_NAME}.s3.localhost.localstack.cloud:4566`
    : `https://${MEDIA_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com`);

// Default file paths
const DEFAULT_BOOKS_FILE = path.join(__dirname, '../data/books.csv');
const DEFAULT_WORDS_FILE = path.join(__dirname, '../data/words.csv');

// Initialize DynamoDB client
const dynamodbClient = new DynamoDBClient({
  region: AWS_REGION,
  endpoint: AWS_ENDPOINT,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

const dynamodbDocumentClient = DynamoDBDocumentClient.from(dynamodbClient);

interface BookData {
  bookId: string;
  itemType: string; // "BOOK" for books
  series: string;
  seriesUrdu?: string;
  title: string;
  titleUrdu?: string;
  description: string;
  descriptionUrdu?: string;
  sheet?: string;
  sheetTitle?: string;
  createdAt: string;
  updatedAt: string;
}

interface ChapterData {
  bookId: string;
  itemType: string; // "CHAPTER#chapterId" for chapters
  chapterId: string;
  chapterNumber: number;
  title: string;
  titleUrdu?: string;
  createdAt: string;
  updatedAt: string;
}

interface WordCSVRow {
  type: string;           // Column 0: Type (noun/verb)
  book: string;            // Column 1: Book
  chapter: string;         // Column 2: Chapter
  page: string;            // Column 3: Page
  wordNumber: string;     // Column 4: Word
  frequency: string;      // Column 5: Frequency
  arabicText: string;     // Column 6: noun/verb (Arabic text)
  pluralForm: string;     // Column 7: plural/verb presetn
  gender: string;          // Column 8: Gender
  audioFileName: string;   // Column 9: Audio File
  translation: string;    // Column 10: english
  pluralTranslation: string; // Column 11: english (second)
  urduTranslation: string;  // Column 12: urdu
  urduPluralTranslation: string; // Column 13: urdu (second)
}

interface VocabularyWord {
  wordId: string;
  arabicText: string;
  transliteration: string;
  translation: string;
  urduTranslation?: string;
  rootLetters: string;
  wordType: 'noun' | 'verb' | 'particle' | 'adjective';
  frequency: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  mediaContent: {
    audioUrl: string;
    imageUrls: string[];
    calligraphyUrl: string;
  };
  contextualExamples: any[];
  relatedWords: string[];
  bookId?: string;
  book?: number;
  chapterId?: string;
  chapter?: number;
  page?: number;
  wordNumber?: number;
  pluralForm?: string;
  presentTenseForm?: string;
  pluralTranslation?: string;
  audioFileName?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Parse books CSV file
 */
function parseBooksCSV(filePath: string): { book: BookData; chapters: ChapterData[] } | null {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: false,
    skip_empty_lines: false,
    trim: true,
    relax_column_count: true,
  });

  if (records.length < 3) {
    console.error('❌ Books CSV file must have at least 3 rows');
    return null;
  }

  // Row 1: Headers (id, language, series, book, description, sheet, sheet_title)
  // Row 2: English data
  // Row 3: Urdu data
  const englishRow = records[1];
  const urduRow = records[2];

  if (!englishRow || !englishRow[0]) {
    console.error('❌ Could not find book data in CSV');
    return null;
  }

  const bookId = englishRow[0] || uuid();
  const book: BookData = {
    bookId: `book-${bookId}`,
    itemType: 'BOOK', // Sort key for books
    series: englishRow[2] || '',
    seriesUrdu: urduRow[2] || undefined,
    title: englishRow[3] || '',
    titleUrdu: urduRow[3] || undefined,
    description: englishRow[4] || '',
    descriptionUrdu: urduRow[4] || undefined,
    sheet: englishRow[5] || undefined,
    sheetTitle: englishRow[6] || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Find chapter section (starts around row 13-14)
  let chapterStartIndex = -1;
  for (let i = 0; i < records.length; i++) {
    if (records[i] && records[i][0] && records[i][0].toLowerCase().includes('chapter')) {
      chapterStartIndex = i + 1; // Next row should be headers
      break;
    }
  }

  const chapters: ChapterData[] = [];
  if (chapterStartIndex > 0 && records.length > chapterStartIndex) {
    // Row chapterStartIndex: Headers (book_id, id, english, urdu)
    // Row chapterStartIndex + 1: First chapter data
    for (let i = chapterStartIndex + 1; i < records.length; i++) {
      const row = records[i];
      if (!row || !row[0] || !row[1]) continue; // Skip empty rows

      const chapterBookId = row[0]?.trim();
      const chapterId = row[1]?.trim();
      const chapterTitle = row[2]?.trim();
      const chapterTitleUrdu = row[3]?.trim();

      if (chapterBookId === bookId && chapterId && chapterTitle) {
        const chapterIdValue = `chapter-${bookId}-${chapterId}`;
        chapters.push({
          bookId: book.bookId,
          itemType: `CHAPTER#${chapterIdValue}`, // Sort key for chapters
          chapterId: chapterIdValue,
          chapterNumber: parseInt(chapterId) || 0,
          title: chapterTitle,
          titleUrdu: chapterTitleUrdu || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  return { book, chapters };
}

/**
 * Parse words CSV file
 */
function parseWordsCSV(filePath: string, bookFilter?: number): WordCSVRow[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: false,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  const rows: WordCSVRow[] = [];

  // Skip first two rows (headers)
  for (let i = 2; i < records.length; i++) {
    const record = records[i];
    if (!record || !record[0] || !record[6]) continue; // Skip if no type or Arabic text

    const bookNum = parseInt(record[1] || '0');
    if (bookFilter !== undefined && bookNum !== bookFilter) {
      continue;
    }

    const row: WordCSVRow = {
      type: (record[0] || '').trim(),
      book: (record[1] || '').trim(),
      chapter: (record[2] || '').trim(),
      page: (record[3] || '').trim(),
      wordNumber: (record[4] || '').trim(),
      frequency: (record[5] || '').trim(),
      arabicText: (record[6] || '').trim(),
      pluralForm: (record[7] || '').trim(),
      gender: (record[8] || '').trim(),
      audioFileName: (record[9] || '').trim(),
      translation: (record[10] || '').trim(),
      pluralTranslation: (record[11] || '').trim(),
      urduTranslation: (record[12] || '').trim(),
      urduPluralTranslation: (record[13] || '').trim(),
    };

    if (row.arabicText) {
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Generate deterministic wordId based on book, chapter, page, wordNumber, and Arabic text
 * This ensures the same word always gets the same ID, preventing duplicates
 * Includes Arabic text hash to handle multiple words at the same position
 */
function generateWordId(bookId: string, chapter: number, page: number, wordNumber: number, arabicText: string): string {
  // Create a simple hash from Arabic text (first 10 chars + length)
  // This ensures different Arabic words at the same position get different IDs
  const arabicHash = arabicText.substring(0, 10).replace(/\s/g, '') + arabicText.length;
  return `word-${bookId}-${chapter}-${page}-${wordNumber}-${arabicHash}`;
}

/**
 * Convert CSV row to VocabularyWord
 */
function convertRowToWord(
  row: WordCSVRow,
  bookId: string,
  chapterMap: Map<number, string>
): VocabularyWord | null {
  // Determine word type
  const wordTypeLower = row.type.toLowerCase();
  let wordType: 'noun' | 'verb' | 'particle' | 'adjective';
  if (wordTypeLower.includes('noun')) {
    wordType = 'noun';
  } else if (wordTypeLower.includes('verb')) {
    wordType = 'verb';
  } else if (wordTypeLower.includes('adjective')) {
    wordType = 'adjective';
  } else {
    wordType = 'particle';
  }

  // Parse numeric fields
  const book = parseInt(row.book);
  const chapter = parseInt(row.chapter);
  const page = parseInt(row.page);
  const wordNumber = parseInt(row.wordNumber);
  const frequency = parseInt(row.frequency) || 0;

  // Get chapter ID
  const chapterId = chapterMap.get(chapter);

  // Determine difficulty based on frequency
  let difficulty: 'beginner' | 'intermediate' | 'advanced';
  if (frequency > 100) {
    difficulty = 'beginner';
  } else if (frequency > 20) {
    difficulty = 'intermediate';
  } else {
    difficulty = 'advanced';
  }

  // Generate transliteration (placeholder)
  const transliteration = generateTransliteration(row.arabicText);

  // Extract root letters (placeholder)
  const rootLetters = extractRootLetters(row.arabicText);

  // Build audio URL from filename using S3_BASE_URL from .env
  const audioUrl = row.audioFileName
    ? `${S3_BASE_URL}/audio/${row.audioFileName}`
    : '';

  const now = new Date().toISOString();

  // Generate deterministic wordId to prevent duplicates
  // Include Arabic text to handle multiple words at the same position
  const wordId = generateWordId(bookId, chapter || 0, page || 0, wordNumber || 0, row.arabicText);

  return {
    wordId,
    arabicText: row.arabicText,
    transliteration,
    translation: row.translation,
    urduTranslation: row.urduTranslation || undefined,
    rootLetters,
    wordType,
    frequency,
    difficulty,
    mediaContent: {
      audioUrl,
      imageUrls: [],
      calligraphyUrl: '',
    },
    contextualExamples: [],
    relatedWords: [],
    bookId,
    book,
    chapterId,
    chapter,
    page,
    wordNumber,
    pluralForm: wordType === 'noun' ? (row.pluralForm || undefined) : undefined,
    presentTenseForm: wordType === 'verb' ? (row.pluralForm || undefined) : undefined,
    pluralTranslation: row.pluralTranslation || undefined,
    audioFileName: row.audioFileName || undefined,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Generate transliteration from Arabic text (placeholder)
 */
function generateTransliteration(arabicText: string): string {
  // Placeholder - implement proper transliteration
  return arabicText;
}

/**
 * Extract root letters from Arabic text (placeholder)
 */
function extractRootLetters(arabicText: string): string {
  // Placeholder - implement proper root extraction
  return arabicText.substring(0, 3) || '';
}

/**
 * Write books and chapters to DynamoDB
 */
async function writeBooksAndChapters(
  book: BookData,
  chapters: ChapterData[],
  dryRun: boolean = false
): Promise<void> {
  if (dryRun) {
    console.log(`\n🔍 DRY RUN MODE - Would write:`);
    console.log(`  - 1 book: ${book.title}`);
    console.log(`  - ${chapters.length} chapters`);
    console.log('\nSample book:');
    console.log(JSON.stringify(book, null, 2));
    console.log('\nSample chapter:');
    if (chapters.length > 0) {
      console.log(JSON.stringify(chapters[0], null, 2));
    }
    return;
  }

  // Write book
  try {
    await dynamodbDocumentClient.send(
      new PutCommand({
        TableName: BOOKS_TABLE_NAME,
        Item: book,
      })
    );
    console.log(`✅ Written book: ${book.title}`);
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      console.warn(`⚠️  Books table not found (${BOOKS_TABLE_NAME}). Books and chapters will not be stored separately.`);
      console.warn(`   Words will still be linked with bookId and chapterId for future reference.`);
      return; // Continue with word import
    }
    console.error(`❌ Error writing book:`, error.message);
    // Don't throw - continue with word import even if book write fails
  }

  // Write chapters in batches (only if book write succeeded)
  try {
    const BATCH_SIZE = 25;
    let written = 0;

    for (let i = 0; i < chapters.length; i += BATCH_SIZE) {
      const batch = chapters.slice(i, i + BATCH_SIZE);
      const writeRequests = batch.map(chapter => ({
        PutRequest: {
          Item: chapter,
        },
      }));

      try {
        await dynamodbDocumentClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [BOOKS_TABLE_NAME]: writeRequests,
            },
          })
        );
        written += batch.length;
        console.log(`✅ Written ${written}/${chapters.length} chapters...`);
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.warn(`⚠️  Books table not found. Skipping chapter writes.`);
          break;
        }
        console.error(`❌ Error writing chapters batch:`, error.message);
        // Try individual writes
        for (const chapter of batch) {
          try {
            await dynamodbDocumentClient.send(
              new PutCommand({
                TableName: BOOKS_TABLE_NAME,
                Item: chapter,
              })
            );
            written++;
          } catch (individualError: any) {
            if (individualError.name !== 'ResourceNotFoundException') {
              console.error(`❌ Error writing chapter ${chapter.title}:`, individualError.message);
            }
          }
        }
      }
    }

    if (written > 0) {
      console.log(`✅ Successfully written ${written} chapters`);
    }
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      console.warn(`⚠️  Books table not found. Chapters will not be stored separately.`);
    } else {
      console.error(`❌ Error writing chapters:`, error.message);
    }
  }
}

/**
 * Write words to DynamoDB in batches with duplicate checking
 */
async function writeWordsToDynamoDB(words: VocabularyWord[], dryRun: boolean = false, updateExisting: boolean = false): Promise<void> {
  if (dryRun) {
    console.log(`\n🔍 DRY RUN MODE - Would write ${words.length} words to DynamoDB`);
    console.log('\nSample word:');
    console.log(JSON.stringify(words[0], null, 2));
    return;
  }

  let written = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  // Process words individually to check for duplicates
  for (const word of words) {
    try {
      // Check if word already exists
      const existing = await dynamodbDocumentClient.send(
        new GetCommand({
          TableName: VOCABULARY_TABLE_NAME,
          Key: {
            wordId: word.wordId,
          },
        })
      );

      if (existing.Item) {
        if (updateExisting) {
          // Update existing word
          await dynamodbDocumentClient.send(
            new PutCommand({
              TableName: VOCABULARY_TABLE_NAME,
              Item: word,
            })
          );
          updated++;
          if (updated % 50 === 0) {
            console.log(`✅ Updated ${updated}/${words.length} words...`);
          }
        } else {
          // Skip duplicate
          skipped++;
          if (skipped % 50 === 0) {
            console.log(`⏭️  Skipped ${skipped} duplicates...`);
          }
        }
      } else {
        // Insert new word
        await dynamodbDocumentClient.send(
          new PutCommand({
            TableName: VOCABULARY_TABLE_NAME,
            Item: word,
            ConditionExpression: 'attribute_not_exists(wordId)', // Extra safety check
          })
        );
        written++;
        if (written % 50 === 0) {
          console.log(`✅ Written ${written}/${words.length} words...`);
        }
      }
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        // Word was inserted between our check and insert - skip it
        skipped++;
      } else {
        console.error(`❌ Error writing word ${word.arabicText} (${word.wordId}):`, error.message);
        errors++;
      }
    }
  }

  console.log(`\n✅ Import complete!`);
  console.log(`   Written: ${written} new words`);
  if (updateExisting) {
    console.log(`   Updated: ${updated} existing words`);
  } else {
    console.log(`   Skipped: ${skipped} duplicates`);
  }
  if (errors > 0) {
    console.log(`   Errors: ${errors} words failed to write`);
  }
}

/**
 * Print summary of data in database
 */
async function printSummary(): Promise<void> {
  console.log('📊 Database Summary');
  console.log('==================\n');

  try {
    // Get all items from books table
    const allItemsResult = await dynamodbDocumentClient.send(
      new ScanCommand({
        TableName: BOOKS_TABLE_NAME,
      })
    );

    const allItems = allItemsResult.Items || [];
    
    // Separate books from chapters
    // Books have itemType = "BOOK"
    // Chapters have itemType starting with "CHAPTER#"
    const books = allItems.filter(item => item.itemType === 'BOOK');
    const chapters = allItems.filter(item => item.itemType && item.itemType.startsWith('CHAPTER#'));
    
    if (books.length === 0) {
      console.log('⚠️  No books found in database');
      console.log(`   Run: npm run import:vocabulary`);
      return;
    }

    for (const book of books) {
      console.log(`📚 Book: ${book.title || book.bookId}`);
      if (book.titleUrdu) {
        console.log(`   Urdu: ${book.titleUrdu}`);
      }
      if (book.series) {
        console.log(`   Series: ${book.series}`);
      }
      if (book.description) {
        const desc = book.description.length > 100 
          ? `${book.description.substring(0, 100)}...` 
          : book.description;
        console.log(`   Description: ${desc}`);
      }

      // Count chapters for this book
      const bookChapters = chapters.filter(ch => ch.bookId === book.bookId);
      console.log(`   📖 Chapters: ${bookChapters.length}`);

      // Count words for this book
      const wordsResult = await dynamodbDocumentClient.send(
        new ScanCommand({
          TableName: VOCABULARY_TABLE_NAME,
          FilterExpression: 'bookId = :bookId',
          ExpressionAttributeValues: {
            ':bookId': book.bookId,
          },
        })
      );
      const words = wordsResult.Items || [];
      console.log(`   📝 Words: ${words.length}`);

      // Show chapter breakdown (limit to first 10 for readability)
      if (bookChapters.length > 0 && bookChapters.length <= 10) {
        console.log(`   Chapter Details:`);
        bookChapters
          .sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0))
          .forEach(ch => {
            const chapterWords = words.filter((w: any) => w.chapterId === ch.chapterId);
            console.log(`     ${ch.chapterNumber}. ${ch.title}: ${chapterWords.length} words`);
          });
      } else if (bookChapters.length > 10) {
        console.log(`   Chapter Details (first 10):`);
        bookChapters
          .sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0))
          .slice(0, 10)
          .forEach(ch => {
            const chapterWords = words.filter((w: any) => w.chapterId === ch.chapterId);
            console.log(`     ${ch.chapterNumber}. ${ch.title}: ${chapterWords.length} words`);
          });
        console.log(`     ... and ${bookChapters.length - 10} more chapters`);
      }

      console.log('');
    }

    // Total summary
    const allWordsResult = await dynamodbDocumentClient.send(
      new ScanCommand({
        TableName: VOCABULARY_TABLE_NAME,
        Select: 'COUNT',
      })
    );
    const totalWords = allWordsResult.Count || 0;

    console.log('📈 Total Summary:');
    console.log(`   Books: ${books.length}`);
    console.log(`   Chapters: ${chapters.length}`);
    console.log(`   Words: ${totalWords}`);
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      console.error(`❌ Table not found: ${error.message}`);
      console.log(`   Make sure tables are deployed: npm run deploy:local`);
    } else {
      console.error(`❌ Error reading database:`, error.message);
      console.error(`   Stack:`, error.stack);
    }
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  // Check if summary command
  if (args.includes('--summary') || args.includes('summary')) {
    await printSummary();
    return;
  }

  // Parse command line arguments
  let booksFilePath: string | null = null;
  let wordsFilePath: string | null = null;
  let bookFilter: number | undefined = undefined;
  let dryRun = false;
  let updateExisting = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--books-file' && args[i + 1]) {
      booksFilePath = args[i + 1];
      i++;
    } else if (args[i] === '--words-file' && args[i + 1]) {
      wordsFilePath = args[i + 1];
      i++;
    } else if (args[i] === '--book' && args[i + 1]) {
      bookFilter = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--update-existing') {
      updateExisting = true;
    }
  }

  // Use default file paths if not specified
  booksFilePath = booksFilePath || DEFAULT_BOOKS_FILE;
  wordsFilePath = wordsFilePath || DEFAULT_WORDS_FILE;

  if (!fs.existsSync(booksFilePath)) {
    console.error(`❌ Error: Books file not found: ${booksFilePath}`);
    process.exit(1);
  }

  if (!fs.existsSync(wordsFilePath)) {
    console.error(`❌ Error: Words file not found: ${wordsFilePath}`);
    process.exit(1);
  }

  console.log('📖 Vocabulary Data Import Script');
  console.log('================================');
  console.log(`Books file: ${booksFilePath}`);
  console.log(`Words file: ${wordsFilePath}`);
  if (bookFilter !== undefined) {
    console.log(`Filter: Book ${bookFilter} only`);
  }
  console.log(`Vocabulary Table: ${VOCABULARY_TABLE_NAME}`);
  console.log(`Books Table: ${BOOKS_TABLE_NAME}`);
  console.log(`S3 Base URL: ${S3_BASE_URL}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  // Parse books CSV
  console.log('📚 Parsing books CSV file...');
  const bookData = parseBooksCSV(booksFilePath);
  if (!bookData) {
    console.error('❌ Failed to parse books CSV');
    process.exit(1);
  }
  console.log(`✅ Found book: ${bookData.book.title}`);
  console.log(`✅ Found ${bookData.chapters.length} chapters`);

  // Create chapter map for linking
  const chapterMap = new Map<number, string>();
  bookData.chapters.forEach(ch => {
    chapterMap.set(ch.chapterNumber, ch.chapterId);
  });

  // Write books and chapters
  console.log('💾 Writing books and chapters to DynamoDB...');
  await writeBooksAndChapters(bookData.book, bookData.chapters, dryRun);

  // Parse words CSV
  console.log('📄 Parsing words CSV file...');
  const wordRows = parseWordsCSV(wordsFilePath, bookFilter);
  console.log(`✅ Found ${wordRows.length} word rows`);

  // Convert to words
  console.log('🔄 Converting rows to vocabulary words...');
  const words = wordRows
    .map(row => convertRowToWord(row, bookData.book.bookId, chapterMap))
    .filter((word): word is VocabularyWord => word !== null);

  console.log(`✅ Converted ${words.length} words`);

  if (words.length === 0) {
    console.log('⚠️  No words to import');
    process.exit(0);
  }

  // Write to DynamoDB
  console.log('💾 Writing words to DynamoDB...');
  await writeWordsToDynamoDB(words, dryRun, updateExisting);

  console.log('\n✅ Import complete!');
  console.log(`\nSummary:`);
  console.log(`  - Books: 1`);
  console.log(`  - Chapters: ${bookData.chapters.length}`);
  console.log(`  - Words: ${words.length}`);
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
