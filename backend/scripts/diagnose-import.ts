/**
 * Diagnostic script to identify missing words
 * Compares CSV file with database to find discrepancies
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

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

loadEnvFile();

const VOCABULARY_TABLE_NAME = process.env.VOCABULARY_TABLE_NAME || 'mufradat-vocabulary-local';
const BOOKS_TABLE_NAME = process.env.BOOKS_TABLE_NAME || 'mufradat-books-local';
const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const AWS_ENDPOINT = process.env.AWS_ENDPOINT || process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';

const dynamodbClient = new DynamoDBClient({
  region: AWS_REGION,
  endpoint: AWS_ENDPOINT,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
});

const dynamodbDocumentClient = DynamoDBDocumentClient.from(dynamodbClient);

function generateWordId(bookId: string, chapter: number, page: number, wordNumber: number, arabicText: string): string {
  // Create a simple hash from Arabic text (first 10 chars + length)
  const arabicHash = arabicText.substring(0, 10).replace(/\s/g, '') + arabicText.length;
  return `word-${bookId}-${chapter}-${page}-${wordNumber}-${arabicHash}`;
}

async function main() {
  const wordsFilePath = path.join(__dirname, '../data/words.csv');
  
  console.log('🔍 Diagnosing Import Discrepancy');
  console.log('================================\n');

  // Parse CSV
  console.log('📄 Parsing CSV file...');
  const fileContent = fs.readFileSync(wordsFilePath, 'utf-8');
  const records = parse(fileContent, {
    columns: false,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  const csvWords = new Map<string, any>();
  let skippedRows = 0;
  let rowsWithEmptyArabic = 0;

  // Process CSV rows (skip first 2 header rows)
  for (let i = 2; i < records.length; i++) {
    const record = records[i];
    
    // Check if row should be skipped
    if (!record || !record[0] || !record[6]) {
      skippedRows++;
      const reason = !record ? 'empty row' : !record[0] ? 'no type' : 'no Arabic text';
      if (!record[6]) {
        rowsWithEmptyArabic++;
      }
      console.log(`⚠️  Row ${i + 1}: Skipped (${reason}) - Type: "${record?.[0] || ''}", Book: "${record?.[1] || ''}", Chapter: "${record?.[2] || ''}", Page: "${record?.[3] || ''}", Word: "${record?.[4] || ''}", Arabic: "${record?.[6] || ''}"`);
      continue;
    }

    const book = parseInt(record[1] || '0');
    const chapter = parseInt(record[2] || '0');
    const page = parseInt(record[3] || '0');
    const wordNumber = parseInt(record[4] || '0');
    const arabicText = (record[6] || '').trim();

    if (!arabicText) {
      rowsWithEmptyArabic++;
      continue;
    }

    const bookId = `book-${book}`;
    const wordId = generateWordId(bookId, chapter, page, wordNumber, arabicText);
    
    // Check for duplicate wordIds (same position)
    if (csvWords.has(wordId)) {
      const existing = csvWords.get(wordId)!;
      console.log(`⚠️  Row ${i + 1}: Duplicate wordId ${wordId}`);
      console.log(`      Previous: Row ${existing.row} - ${existing.arabicText}`);
      console.log(`      Current: Row ${i + 1} - ${arabicText}`);
    }
    
    csvWords.set(wordId, {
      wordId,
      row: i + 1,
      book,
      chapter,
      page,
      wordNumber,
      arabicText,
      translation: (record[10] || '').trim(),
    });
  }

  console.log(`\n📊 CSV Analysis:`);
  console.log(`   Total rows in CSV: ${records.length - 2} (excluding headers)`);
  console.log(`   Valid words found: ${csvWords.size}`);
  console.log(`   Skipped rows: ${skippedRows}`);
  console.log(`   Rows with empty Arabic text: ${rowsWithEmptyArabic}`);

  // Get all words from database
  console.log('\n💾 Scanning database...');
  const dbWords = new Map<string, any>();
  let lastEvaluatedKey: any = undefined;
  let dbCount = 0;

  do {
    const scanResult = await dynamodbDocumentClient.send(
      new ScanCommand({
        TableName: VOCABULARY_TABLE_NAME,
        ExclusiveStartKey: lastEvaluatedKey,
        Limit: 100,
      })
    );

    const items = scanResult.Items || [];
    lastEvaluatedKey = scanResult.LastEvaluatedKey;

    for (const item of items) {
      dbWords.set(item.wordId, item);
      dbCount++;
    }
  } while (lastEvaluatedKey);

  console.log(`   Words in database: ${dbCount}`);

  // Find missing words
  console.log('\n🔎 Finding discrepancies...');
  const missingInDb: any[] = [];
  const extraInDb: any[] = [];

  for (const [wordId, csvWord] of csvWords.entries()) {
    if (!dbWords.has(wordId)) {
      missingInDb.push(csvWord);
    }
  }

  for (const [wordId, dbWord] of dbWords.entries()) {
    if (!csvWords.has(wordId)) {
      extraInDb.push(dbWord);
    }
  }

  console.log(`\n📈 Results:`);
  console.log(`   Words in CSV: ${csvWords.size}`);
  console.log(`   Words in DB: ${dbWords.size}`);
  console.log(`   Missing in DB: ${missingInDb.length}`);
  console.log(`   Extra in DB: ${extraInDb.length}`);

  if (missingInDb.length > 0) {
    console.log(`\n❌ Missing words in database (first 20):`);
    missingInDb.slice(0, 20).forEach(word => {
      console.log(`   Row ${word.row}: ${word.arabicText} (${word.translation}) - Book ${word.book}, Ch ${word.chapter}, Pg ${word.page}, Word ${word.wordNumber}`);
      console.log(`      Expected wordId: ${word.wordId}`);
    });
    if (missingInDb.length > 20) {
      console.log(`   ... and ${missingInDb.length - 20} more`);
    }
  }

  if (extraInDb.length > 0) {
    console.log(`\n⚠️  Extra words in database (first 10):`);
    extraInDb.slice(0, 10).forEach(word => {
      console.log(`   ${word.wordId}: ${word.arabicText} (${word.translation})`);
    });
    if (extraInDb.length > 10) {
      console.log(`   ... and ${extraInDb.length - 10} more`);
    }
  }

  // Check for potential issues
  console.log(`\n🔍 Potential Issues:`);
  
  // Check for words with same book-chapter-page-wordNumber but different IDs
  const duplicatePositions = new Map<string, string[]>();
  for (const [wordId, word] of csvWords.entries()) {
    const key = `${word.book}-${word.chapter}-${word.page}-${word.wordNumber}`;
    if (!duplicatePositions.has(key)) {
      duplicatePositions.set(key, []);
    }
    duplicatePositions.get(key)!.push(wordId);
  }

  let duplicateCount = 0;
  for (const [key, wordIds] of duplicatePositions.entries()) {
    if (wordIds.length > 1) {
      duplicateCount++;
      if (duplicateCount <= 5) {
        console.log(`   ⚠️  Duplicate position ${key} has ${wordIds.length} words: ${wordIds.join(', ')}`);
      }
    }
  }
  if (duplicateCount > 5) {
    console.log(`   ... and ${duplicateCount - 5} more duplicate positions`);
  }

  console.log(`\n✅ Diagnosis complete!`);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

