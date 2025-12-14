/**
 * Delete Vocabulary Data Script
 * 
 * This script deletes vocabulary words, books, and chapters from DynamoDB.
 * 
 * Usage:
 *   npm run delete:vocabulary -- --all                    # Delete all data
 *   npm run delete:vocabulary -- --book 1                 # Delete book 1 and its words
 *   npm run delete:vocabulary -- --words-only             # Delete only words, keep books/chapters
 *   npm run delete:vocabulary -- --books-only             # Delete only books/chapters, keep words
 *   npm run delete:vocabulary -- --dry-run                # Dry run (show what would be deleted)
 */

import * as fs from 'fs';
import * as path from 'path';
import { ScanCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
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

// Load environment variables
loadEnvFile();

// Configuration
const VOCABULARY_TABLE_NAME = process.env.VOCABULARY_TABLE_NAME || 'mufradat-vocabulary-local';
const BOOKS_TABLE_NAME = process.env.BOOKS_TABLE_NAME || 'mufradat-books-local';
const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const AWS_ENDPOINT = process.env.AWS_ENDPOINT || process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';

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

/**
 * Delete all words
 */
async function deleteAllWords(dryRun: boolean = false): Promise<number> {
  console.log('📝 Scanning words table...');
  let deleted = 0;
  let lastEvaluatedKey: any = undefined;

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

    if (items.length === 0) {
      break;
    }

    if (dryRun) {
      console.log(`🔍 Would delete ${items.length} words (total: ${deleted + items.length})...`);
      deleted += items.length;
    } else {
      // Delete in batches
      const BATCH_SIZE = 25;
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        const deleteRequests = batch.map(item => ({
          DeleteRequest: {
            Key: {
              wordId: item.wordId,
            },
          },
        }));

        try {
          await dynamodbDocumentClient.send(
            new BatchWriteCommand({
              RequestItems: {
                [VOCABULARY_TABLE_NAME]: deleteRequests,
              },
            })
          );
          deleted += batch.length;
          console.log(`✅ Deleted ${deleted} words...`);
        } catch (error: any) {
          console.error(`❌ Error deleting batch:`, error.message);
          // Try individual deletes
          for (const item of batch) {
            try {
              await dynamodbDocumentClient.send(
                new DeleteCommand({
                  TableName: VOCABULARY_TABLE_NAME,
                  Key: {
                    wordId: item.wordId,
                  },
                })
              );
              deleted++;
            } catch (individualError: any) {
              console.error(`❌ Error deleting word ${item.wordId}:`, individualError.message);
            }
          }
        }
      }
    }
  } while (lastEvaluatedKey);

  return deleted;
}

/**
 * Delete words for a specific book
 */
async function deleteWordsByBook(bookId: string, dryRun: boolean = false): Promise<number> {
  console.log(`📝 Scanning words for book ${bookId}...`);
  let deleted = 0;
  let lastEvaluatedKey: any = undefined;

  do {
    const scanResult = await dynamodbDocumentClient.send(
      new ScanCommand({
        TableName: VOCABULARY_TABLE_NAME,
        FilterExpression: 'bookId = :bookId',
        ExpressionAttributeValues: {
          ':bookId': bookId,
        },
        ExclusiveStartKey: lastEvaluatedKey,
        Limit: 100,
      })
    );

    const items = scanResult.Items || [];
    lastEvaluatedKey = scanResult.LastEvaluatedKey;

    if (items.length === 0) {
      break;
    }

    if (dryRun) {
      console.log(`🔍 Would delete ${items.length} words (total: ${deleted + items.length})...`);
      deleted += items.length;
    } else {
      // Delete in batches
      const BATCH_SIZE = 25;
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        const deleteRequests = batch.map(item => ({
          DeleteRequest: {
            Key: {
              wordId: item.wordId,
            },
          },
        }));

        try {
          await dynamodbDocumentClient.send(
            new BatchWriteCommand({
              RequestItems: {
                [VOCABULARY_TABLE_NAME]: deleteRequests,
              },
            })
          );
          deleted += batch.length;
          console.log(`✅ Deleted ${deleted} words...`);
        } catch (error: any) {
          console.error(`❌ Error deleting batch:`, error.message);
        }
      }
    }
  } while (lastEvaluatedKey);

  return deleted;
}

/**
 * Delete all books and chapters
 */
async function deleteAllBooksAndChapters(dryRun: boolean = false): Promise<number> {
  console.log('📚 Scanning books table...');
  let deleted = 0;
  let lastEvaluatedKey: any = undefined;

  do {
    const scanResult = await dynamodbDocumentClient.send(
      new ScanCommand({
        TableName: BOOKS_TABLE_NAME,
        ExclusiveStartKey: lastEvaluatedKey,
        Limit: 100,
      })
    );

    const items = scanResult.Items || [];
    lastEvaluatedKey = scanResult.LastEvaluatedKey;

    if (items.length === 0) {
      break;
    }

    if (dryRun) {
      console.log(`🔍 Would delete ${items.length} items (total: ${deleted + items.length})...`);
      deleted += items.length;
    } else {
      // Delete in batches
      const BATCH_SIZE = 25;
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        const deleteRequests = batch.map(item => ({
          DeleteRequest: {
            Key: {
              bookId: item.bookId,
              itemType: item.itemType,
            },
          },
        }));

        try {
          await dynamodbDocumentClient.send(
            new BatchWriteCommand({
              RequestItems: {
                [BOOKS_TABLE_NAME]: deleteRequests,
              },
            })
          );
          deleted += batch.length;
          console.log(`✅ Deleted ${deleted} items...`);
        } catch (error: any) {
          console.error(`❌ Error deleting batch:`, error.message);
        }
      }
    }
  } while (lastEvaluatedKey);

  return deleted;
}

/**
 * Delete books and chapters for a specific book
 */
async function deleteBookAndChapters(bookId: string, dryRun: boolean = false): Promise<number> {
  console.log(`📚 Scanning books table for book ${bookId}...`);
  let deleted = 0;
  let lastEvaluatedKey: any = undefined;

  do {
    const scanResult = await dynamodbDocumentClient.send(
      new ScanCommand({
        TableName: BOOKS_TABLE_NAME,
        FilterExpression: 'bookId = :bookId',
        ExpressionAttributeValues: {
          ':bookId': bookId,
        },
        ExclusiveStartKey: lastEvaluatedKey,
        Limit: 100,
      })
    );

    const items = scanResult.Items || [];
    lastEvaluatedKey = scanResult.LastEvaluatedKey;

    if (items.length === 0) {
      break;
    }

    if (dryRun) {
      console.log(`🔍 Would delete ${items.length} items (total: ${deleted + items.length})...`);
      deleted += items.length;
    } else {
      // Delete in batches
      const BATCH_SIZE = 25;
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        const deleteRequests = batch.map(item => ({
          DeleteRequest: {
            Key: {
              bookId: item.bookId,
              itemType: item.itemType,
            },
          },
        }));

        try {
          await dynamodbDocumentClient.send(
            new BatchWriteCommand({
              RequestItems: {
                [BOOKS_TABLE_NAME]: deleteRequests,
              },
            })
          );
          deleted += batch.length;
          console.log(`✅ Deleted ${deleted} items...`);
        } catch (error: any) {
          console.error(`❌ Error deleting batch:`, error.message);
        }
      }
    }
  } while (lastEvaluatedKey);

  return deleted;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse command line arguments
  let deleteAll = false;
  let deleteWordsOnly = false;
  let deleteBooksOnly = false;
  let bookFilter: string | undefined = undefined;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--all') {
      deleteAll = true;
    } else if (args[i] === '--words-only') {
      deleteWordsOnly = true;
    } else if (args[i] === '--books-only') {
      deleteBooksOnly = true;
    } else if (args[i] === '--book' && args[i + 1]) {
      bookFilter = `book-${args[i + 1]}`;
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    }
  }

  if (!deleteAll && !deleteWordsOnly && !deleteBooksOnly && !bookFilter) {
    console.error('❌ Error: Must specify what to delete');
    console.log('\nUsage:');
    console.log('  npm run delete:vocabulary -- --all                    # Delete all data');
    console.log('  npm run delete:vocabulary -- --book 1                 # Delete book 1 and its words');
    console.log('  npm run delete:vocabulary -- --words-only             # Delete only words');
    console.log('  npm run delete:vocabulary -- --books-only              # Delete only books/chapters');
    console.log('  npm run delete:vocabulary -- --dry-run                 # Dry run');
    process.exit(1);
  }

  console.log('🗑️  Vocabulary Data Delete Script');
  console.log('==================================');
  console.log(`Vocabulary Table: ${VOCABULARY_TABLE_NAME}`);
  console.log(`Books Table: ${BOOKS_TABLE_NAME}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No data will be deleted');
    console.log('');
  } else {
    console.log('⚠️  WARNING: This will permanently delete data!');
    console.log('   Press Ctrl+C within 5 seconds to cancel...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('');
  }

  try {
    let wordsDeleted = 0;
    let booksDeleted = 0;

    if (bookFilter) {
      // Delete specific book
      console.log(`🗑️  Deleting book ${bookFilter}...`);
      wordsDeleted = await deleteWordsByBook(bookFilter, dryRun);
      booksDeleted = await deleteBookAndChapters(bookFilter, dryRun);
    } else if (deleteAll) {
      // Delete everything
      console.log('🗑️  Deleting all data...');
      if (!deleteBooksOnly) {
        wordsDeleted = await deleteAllWords(dryRun);
      }
      if (!deleteWordsOnly) {
        booksDeleted = await deleteAllBooksAndChapters(dryRun);
      }
    } else if (deleteWordsOnly) {
      // Delete only words
      console.log('🗑️  Deleting all words...');
      wordsDeleted = await deleteAllWords(dryRun);
    } else if (deleteBooksOnly) {
      // Delete only books/chapters
      console.log('🗑️  Deleting all books and chapters...');
      booksDeleted = await deleteAllBooksAndChapters(dryRun);
    }

    console.log('\n✅ Delete complete!');
    console.log(`   Words deleted: ${wordsDeleted}`);
    console.log(`   Books/Chapters deleted: ${booksDeleted}`);
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      console.error(`❌ Table not found: ${error.message}`);
      console.log(`   Make sure tables are deployed: npm run deploy:local`);
    } else {
      console.error(`❌ Fatal error:`, error.message);
      console.error(`   Stack:`, error.stack);
    }
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

