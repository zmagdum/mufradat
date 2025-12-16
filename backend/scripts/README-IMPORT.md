# Vocabulary Data Import Guide

This guide explains how to import books, chapters, and vocabulary words from CSV files into DynamoDB.

## Prerequisites

1. **CSV Files in `backend/data/` folder**
   - `books.csv` - Contains book and chapter information
   - `words.csv` - Contains vocabulary words
   
   The script uses these default locations, but you can override them with command-line arguments.

2. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Ensure LocalStack is Running** (for local development)
   ```bash
   npm run localstack:start
   ```

4. **Deploy Tables** (if not already deployed)
   ```bash
   npm run deploy:local
   ```
   
   **Note:** The script will create books and chapters in the `mufradat-books-local` table. If this table doesn't exist, you may need to create it or the script will store books/chapters in the vocabulary table with a different key structure.

## CSV File Formats

### Books CSV (`books.csv`)

The books CSV file has the following structure:
- **Row 1**: Headers (`id, language, series, book, description, sheet, sheet_title`)
- **Row 2**: English book data
- **Row 3**: Urdu book data
- **Row 13**: "Chapter Titles" header
- **Row 14**: Chapter headers (`book_id, id, english, urdu`)
- **Row 15+**: Chapter data

### Words CSV (`words.csv`)

The words CSV file has the following columns:

| Column | Index | Description | Example |
|--------|-------|-------------|---------|
| Type | 0 | Word Type | `noun` or `verb` |
| Book | 1 | Book Number | `1` |
| Chapter | 2 | Chapter Number | `1` |
| Page | 3 | Page Number | `1` |
| Word | 4 | Word Number | `1` |
| Frequency | 5 | Frequency | `245` (times appears in Quran) |
| noun/verb | 6 | Arabic Text | `كِتَاب` |
| plural/verb presetn | 7 | Plural/Present Tense | `كُتُب` (for nouns) or `يَكْتُبُ` (for verbs) |
| Gender | 8 | Gender | - |
| Audio File | 9 | Audio File Name | `kitab.mp3` |
| english | 10 | English Translation | `book` |
| english | 11 | Plural/Present Translation (English) | `books` or `writes` |
| urdu | 12 | Urdu Translation | `کتاب` |
| urdu | 13 | Plural/Present Translation (Urdu) | - |

**Note:** The first two rows contain headers. The script automatically skips them.

## Usage

### Default Usage (Recommended)

Import from default file locations (`backend/data/books.csv` and `backend/data/words.csv`):

```bash
npm run import:vocabulary
```

### Dry Run (Recommended First)

Test the import without actually writing to DynamoDB:

```bash
npm run import:vocabulary -- --dry-run
```

### Import Book 1 Only

```bash
npm run import:vocabulary -- --book 1
```

### Custom File Paths

```bash
npm run import:vocabulary -- --books-file path/to/books.csv --words-file path/to/words.csv
```

### View Database Summary

Print a summary of all data in the database:

```bash
npm run summary:vocabulary
```

This will show:
- Book titles (English and Urdu)
- Number of chapters per book
- Number of words per book
- Chapter breakdown with word counts
- Total summary across all books

### Update Existing Words

By default, the import script **updates existing words** when duplicates are found. To skip existing words and only add new ones:

```bash
npm run import:vocabulary -- --no-update
```

**Note:** The `--update-existing` flag is still supported for backward compatibility, but it's now the default behavior.

### Delete Data

Delete vocabulary data from the database:

```bash
# Delete all data (words, books, chapters)
npm run delete:vocabulary -- --all

# Delete only words (keep books/chapters)
npm run delete:vocabulary -- --words-only

# Delete only books/chapters (keep words)
npm run delete:vocabulary -- --books-only

# Delete specific book and its words
npm run delete:vocabulary -- --book 1

# Dry run (see what would be deleted)
npm run delete:vocabulary -- --all --dry-run
```

**⚠️ Warning:** Deletion is permanent! Use `--dry-run` first to see what would be deleted.

### Environment Variables

The script automatically loads variables from `backend/.env` file if it exists. You can also set these as environment variables:

```bash
# Table names
VOCABULARY_TABLE_NAME=mufradat-vocabulary-local
BOOKS_TABLE_NAME=mufradat-books-local

# AWS Configuration
AWS_REGION=us-east-1
AWS_DEFAULT_REGION=us-east-1
AWS_ENDPOINT=http://localhost:4566  # For LocalStack
AWS_ENDPOINT_URL=http://localhost:4566  # Alternative name

# S3 Configuration
MEDIA_BUCKET_NAME=mufradat-media-local
S3_BASE_URL=http://mufradat-media-local.s3.localhost.localstack.cloud:4566  # For LocalStack
# Or for production:
# S3_BASE_URL=https://mufradat-media-prod.s3.us-east-1.amazonaws.com
```

**Example `.env` file:**

```bash
# backend/.env
VOCABULARY_TABLE_NAME=mufradat-vocabulary-local
BOOKS_TABLE_NAME=mufradat-books-local
AWS_REGION=us-east-1
AWS_ENDPOINT=http://localhost:4566
MEDIA_BUCKET_NAME=mufradat-media-local
S3_BASE_URL=http://mufradat-media-local.s3.localhost.localstack.cloud:4566
```

For production, set these appropriately:

```bash
export VOCABULARY_TABLE_NAME=mufradat-vocabulary-prod
export BOOKS_TABLE_NAME=mufradat-books-prod
export AWS_REGION=us-east-1
export AWS_ENDPOINT=  # Leave empty for real AWS
export S3_BASE_URL=https://mufradat-media-prod.s3.us-east-1.amazonaws.com
npm run import:vocabulary
```

## What the Script Does

1. **Parses Books CSV**: Extracts book information and chapter data
2. **Parses Words CSV**: Reads and parses vocabulary words
3. **Links Data**: Links words to their corresponding books and chapters
4. **Filters by Book**: If `--book` is specified, only processes that book
5. **Converts to VocabularyWord**: Maps CSV columns to the VocabularyWord structure
6. **Generates IDs**: 
   - Creates unique IDs for books and chapters
   - **Generates deterministic wordIds** based on `book-chapter-page-wordNumber` to prevent duplicates
7. **Checks for Duplicates**: Before inserting, checks if word already exists
   - **Default behavior**: Updates existing words (if word exists, it will be updated with new data)
   - If `--no-update` is used: Skips existing words (only adds new words)
8. **Determines Difficulty**: Based on frequency:
   - `beginner`: frequency > 100
   - `intermediate`: frequency 20-100
   - `advanced`: frequency < 20
9. **Writes to DynamoDB**: 
   - Writes books and chapters to the books table
   - Writes words to the vocabulary table (checks for duplicates first)

## Extended Data Structures

### VocabularyWord Structure

The script extends the VocabularyWord type with these additional fields:

- `bookId`: Reference to the book (e.g., `book-1`)
- `book`: Book number (1, 2, 3, etc.)
- `chapterId`: Reference to the chapter (e.g., `chapter-1-1`)
- `chapter`: Chapter number within the book
- `page`: Page number within the chapter
- `wordNumber`: Word number on the page
- `urduTranslation`: Urdu translation of the word
- `pluralForm`: Plural form (for nouns)
- `presentTenseForm`: Present tense form (for verbs)
- `pluralTranslation`: English translation of plural/present tense
- `audioFileName`: Name of audio file in S3 bucket

### Book Structure

- `bookId`: Unique identifier (e.g., `book-1`)
- `series`: Series name in English
- `seriesUrdu`: Series name in Urdu
- `title`: Book title in English
- `titleUrdu`: Book title in Urdu
- `description`: Book description in English
- `descriptionUrdu`: Book description in Urdu

### Chapter Structure

- `chapterId`: Unique identifier (e.g., `chapter-1-1`)
- `bookId`: Reference to the book
- `chapterNumber`: Chapter number within the book
- `title`: Chapter title in English
- `titleUrdu`: Chapter title in Urdu

## Troubleshooting

### "File not found" Error
- Make sure the file path is correct
- Use absolute path if relative path doesn't work: `/Users/yourname/path/to/file.csv`

### "Table not found" Error
- Make sure LocalStack is running: `npm run localstack:start`
- Make sure tables are deployed: `npm run deploy:local`
- Check table names match: `VOCABULARY_TABLE_NAME` and `BOOKS_TABLE_NAME`
- If books table doesn't exist, the script will try to create items but may fail. You can create the table manually or modify the script to use the vocabulary table for books/chapters.

### "No words to import" Warning
- Check that your CSV file has data
- Verify the book filter (if using `--book`)
- Check that Column G (Arabic text) has values

### Column Mapping Issues
If your CSV has different column order, you can modify the `parseCSV` function in `import-vocabulary-data.ts` to match your format.

## Example Output

```
📖 Vocabulary Data Import Script
================================
Books file: /path/to/backend/data/books.csv
Words file: /path/to/backend/data/words.csv
Filter: Book 1 only
Vocabulary Table: mufradat-vocabulary-local
Books Table: mufradat-books-local
Mode: LIVE

📚 Parsing books CSV file...
✅ Found book: 85 % Quranic Words
✅ Found 51 chapters
💾 Writing books and chapters to DynamoDB...
✅ Written book: 85 % Quranic Words
✅ Written 25/51 chapters...
✅ Written 50/51 chapters...
✅ Successfully written 51 chapters
📄 Parsing words CSV file...
✅ Found 723 word rows
🔄 Converting rows to vocabulary words...
✅ Converted 723 words
💾 Writing words to DynamoDB...
✅ Written 25/723 words...
✅ Written 50/723 words...
...
✅ Successfully written 723 words

✅ Import complete!

Summary:
  - Books: 1
  - Chapters: 51
  - Words: 723
```

## Next Steps

After importing:
1. Verify data in DynamoDB (use AWS CLI or LocalStack dashboard)
2. Test API endpoints to retrieve words
3. Import audio files to S3 bucket (if not already done)
4. Update audio URLs in DynamoDB if needed

## Notes

- **Transliteration**: Currently returns placeholder. You may want to implement proper Arabic transliteration.
- **Root Letters**: Currently extracts first 3 characters. You may want to implement proper root extraction.
- **Audio URLs**: Script generates S3 URLs based on filename. Update the bucket name in the script if needed.

