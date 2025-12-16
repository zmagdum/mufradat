# Quranic Vocabulary Learning App

A comprehensive cross-platform mobile application for learning Quranic vocabulary through adaptive learning algorithms, spaced repetition, and multi-modal content delivery.

## Project Structure

```
├── mobile/                       # React Native mobile app (Expo)
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── screens/              # Screen components
│   │   ├── services/             # API and service layers
│   │   ├── utils/                # Utility functions
│   │   ├── types/                # TypeScript type definitions
│   │   ├── contexts/             # React contexts
│   │   ├── store/                # State management (Redux)
│   │   └── config/               # App configuration
│   └── ...
├── backend/                      # AWS Lambda functions and backend
│   ├── src/lambdas/              # Individual Lambda functions
│   ├── infrastructure/          # AWS CDK infrastructure code
│   ├── scripts/                  # Deployment and utility scripts
│   └── ...
├── shared/                       # Shared code between mobile and backend
│   ├── types/                    # Shared TypeScript types
│   ├── validators/               # Shared validation functions
│   └── transformers/             # Data transformation utilities
└── docs/                         # Project documentation
```

## Features

- **Multi-Modal Learning**: Visual, auditory, contextual, and associative learning methods
- **Adaptive Spaced Repetition**: Personalized review scheduling based on performance
- **Verb Conjugation Training**: Interactive Arabic verb conjugation exercises
- **Cross-Platform**: iOS and Android support with offline capabilities
- **Progress Tracking**: Detailed analytics and achievement system
- **Cost-Optimized Backend**: Serverless AWS infrastructure

## Technology Stack

### Frontend (Mobile App)
- React Native with Expo
- TypeScript
- Redux Toolkit for state management
- React Navigation for routing
- Jest for testing

### Backend
- AWS Lambda (Node.js/TypeScript)
- AWS API Gateway
- AWS Cognito for authentication
- Amazon DynamoDB for data storage
- Amazon S3 for media content
- Amazon CloudFront for CDN

### Infrastructure
- AWS CDK for Infrastructure as Code
- TypeScript for CDK definitions

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- AWS CLI (for backend deployment)
- AWS CDK CLI

### Mobile App Setup

1. Navigate to the mobile app directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on specific platforms:
   ```bash
   npm run ios     # iOS simulator
   npm run android # Android emulator
   npm run web     # Web browser
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the TypeScript code:
   ```bash
   npm run build
   ```

### Infrastructure Setup

The infrastructure code is located in `backend/infrastructure/`. See the main [README.md](../README.md) for detailed deployment instructions.

## Development Scripts

### Mobile App
- `npm start` - Start Expo development server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run Jest tests
- `npm run type-check` - Run TypeScript type checking

### Backend
- `npm run build` - Compile TypeScript
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Testing

The project includes comprehensive testing setup:
- Unit tests with Jest
- React Native Testing Library for component tests
- Mock configurations for React Native modules
- Coverage reporting

Run tests:
```bash
npm test
```

## Code Quality

The project enforces code quality through:
- ESLint for code linting
- Prettier for code formatting
- TypeScript for type safety
- Pre-commit hooks (to be configured)

## Contributing

1. Follow the established code style and conventions
2. Write tests for new features
3. Ensure all tests pass before submitting
4. Use meaningful commit messages

## License

This project is licensed under the MIT License.