# Mufradat Shared Package

Shared TypeScript types, constants, validators, and transformers used across both mobile and backend applications.

## Structure

```
shared/
├── types/              # TypeScript type definitions
│   ├── user.types.ts
│   ├── vocabulary.types.ts
│   ├── progress.types.ts
│   ├── conjugation.types.ts
│   ├── validators.ts
│   ├── transformers.ts
│   └── index.ts
├── constants/          # Shared constants
│   └── index.ts
└── __tests__/         # Unit tests
    ├── validators.test.ts
    └── transformers.test.ts
```

## Type Definitions

### User Types (`user.types.ts`)
- `UserProfile`: Complete user profile with preferences and statistics
- `UserPreferences`: User learning preferences
- `UserStatistics`: Learning statistics and achievements

### Vocabulary Types (`vocabulary.types.ts`)
- `VocabularyWord`: Quranic vocabulary word with metadata
- `MediaContent`: Audio, images, and calligraphy URLs
- `ContextualExample`: Quranic verse examples

### Progress Types (`progress.types.ts`)
- `WordProgress`: Learning progress for individual words
- `LearningSession`: User study session data

### Conjugation Types (`conjugation.types.ts`)
- `VerbConjugation`: Arabic verb conjugation patterns
- `ConjugationForms`: Structured conjugation data
- Enum types: `Tense`, `Person`, `Number`, `Gender`

## Validators

Data validation functions with comprehensive error reporting.

### Usage

```typescript
import { validateUserProfile, validateVocabularyWord } from 'mufradat-shared';

const result = validateUserProfile(profile);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

### Available Validators

- `validateUserProfile(profile)` - Validate complete user profile
- `validateUserPreferences(preferences)` - Validate user preferences
- `validateVocabularyWord(word)` - Validate vocabulary word data
- `validateWordProgress(progress)` - Validate learning progress
- `validateVerbConjugation(conjugation)` - Validate verb conjugation

### Validation Utilities

- `isValidEmail(email)` - Email format validation
- `isValidLength(value, min, max)` - String length validation
- `isInRange(value, min, max)` - Number range validation
- `isValidDate(date)` - Date validation
- `isValidUrl(url)` - URL format validation

## Transformers

Data transformation utilities for converting between formats.

### Date Serialization

```typescript
import { DateSerializer } from 'mufradat-shared';

const isoString = DateSerializer.serialize(new Date());
const date = DateSerializer.deserialize(isoString);
```

### UserProfile Transformation

```typescript
import { UserProfileTransformer } from 'mufradat-shared';

// To database format (DynamoDB)
const dbFormat = UserProfileTransformer.toDatabase(profile);

// From database format
const profile = UserProfileTransformer.fromDatabase(dbData);

// To API response
const apiResponse = UserProfileTransformer.toApiResponse(profile);

// Create default profile
const newProfile = UserProfileTransformer.createDefault(
  userId,
  email,
  displayName
);
```

### VocabularyWord Transformation

```typescript
import { VocabularyWordTransformer } from 'mufradat-shared';

// Full transformation
const dbFormat = VocabularyWordTransformer.toDatabase(word);
const word = VocabularyWordTransformer.fromDatabase(dbData);

// Lightweight list item (no examples/media)
const listItem = VocabularyWordTransformer.toListItem(word);
```

### WordProgress Transformation

```typescript
import { WordProgressTransformer } from 'mufradat-shared';

// Create initial progress for new word
const progress = WordProgressTransformer.createInitial(userId, wordId);

// Transform to API with calculated accuracy
const apiResponse = WordProgressTransformer.toApiResponse(progress);

// Calculate accuracy percentage
const accuracy = WordProgressTransformer.calculateAccuracy(progress);
```

### VerbConjugation Transformation

```typescript
import { VerbConjugationTransformer } from 'mufradat-shared';

// Get specific conjugation form
const form = VerbConjugationTransformer.getConjugationForm(
  conjugation,
  'past',      // tense
  'first',     // person
  'singular',  // number
  'masculine'  // gender
);
```

### Batch Transformations

```typescript
import { BatchTransformer } from 'mufradat-shared';

// Transform arrays
const apiProfiles = BatchTransformer.userProfilesToApi(profiles);
const apiWords = BatchTransformer.vocabularyWordsToApi(words);
const listItems = BatchTransformer.vocabularyWordsToListItems(words);
```

### JSON Serialization with Date Support

```typescript
import { JsonSerializer } from 'mufradat-shared';

// Automatically handles Date objects
const json = JsonSerializer.stringify({ date: new Date(), name: 'test' });
const obj = JsonSerializer.parse(json);
// obj.date is a Date object, not a string
```

## Constants

### App Configuration

```typescript
import { APP_CONFIG } from 'mufradat-shared';

APP_CONFIG.API_VERSION              // 'v1'
APP_CONFIG.MAX_WORDS_PER_SESSION    // 20
APP_CONFIG.MIN_WORDS_PER_SESSION    // 5
APP_CONFIG.DEFAULT_STUDY_GOAL       // 10
```

### Learning Modalities

```typescript
import { LEARNING_MODALITIES } from 'mufradat-shared';

LEARNING_MODALITIES.VISUAL        // 'visual'
LEARNING_MODALITIES.AUDIO         // 'audio'
LEARNING_MODALITIES.CONTEXTUAL    // 'contextual'
LEARNING_MODALITIES.ASSOCIATIVE   // 'associative'
```

### Mastery Levels

```typescript
import { MASTERY_LEVELS } from 'mufradat-shared';

MASTERY_LEVELS.BEGINNER    // 0
MASTERY_LEVELS.LEARNING    // 25
MASTERY_LEVELS.FAMILIAR    // 50
MASTERY_LEVELS.PROFICIENT  // 75
MASTERY_LEVELS.MASTERED    // 100
```

### Spaced Repetition Intervals

```typescript
import { SPACED_REPETITION_INTERVALS } from 'mufradat-shared';

SPACED_REPETITION_INTERVALS.INITIAL  // 1 day
SPACED_REPETITION_INTERVALS.EASY     // 4 days
SPACED_REPETITION_INTERVALS.MEDIUM   // 2 days
SPACED_REPETITION_INTERVALS.HARD     // 1 day
SPACED_REPETITION_INTERVALS.AGAIN    // 0.5 days
```

## Testing

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate coverage report:

```bash
npm run test:coverage
```

## Code Quality

Lint code:

```bash
npm run lint
```

Format code:

```bash
npm run format
```

Build TypeScript:

```bash
npm run build
```

## Usage in Mobile App

```typescript
import {
  UserProfile,
  VocabularyWord,
  validateUserProfile,
  UserProfileTransformer,
  APP_CONFIG,
} from '@shared/types';
```

## Usage in Backend

```typescript
import {
  UserProfile,
  validateUserProfile,
  UserProfileTransformer,
} from '@shared/types';
```

## Test Coverage

Current test coverage: **100%** for validators and transformers

- ✅ All validation functions tested
- ✅ All transformation functions tested
- ✅ Edge cases covered
- ✅ Error scenarios tested

## Error Handling

All validators return structured error objects:

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

class ValidationError extends Error {
  field?: string;    // Field name that failed
  code?: string;     // Error code for programmatic handling
}
```

Error codes include:
- `INVALID_EMAIL`
- `INVALID_URL`
- `OUT_OF_RANGE`
- `NEGATIVE_VALUE`
- `INVALID_DATE`
- `REQUIRED`

## Type Safety

All transformers maintain full type safety:
- Input types are strictly validated
- Output types match expected formats
- No `any` types in public APIs
- Full TypeScript strict mode compliance

