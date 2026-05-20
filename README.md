# VZW Backend

A TypeScript/Express backend for managing Belgian VZW (non-profit organizations).

## Project Structure

```
├── src/
│   ├── config/           # Configuration management
│   ├── middleware/       # Express middleware
│   ├── routes/          # Route handlers
│   ├── utils/           # Utility functions and logger
│   ├── __tests__/       # Test files
│   ├── app.ts           # Express app setup
│   └── index.ts         # Entry point
├── dist/                # Compiled JavaScript output
├── .env                 # Environment variables (git ignored)
├── .env.example         # Environment template
├── tsconfig.json        # TypeScript configuration (strict mode)
├── jest.config.json     # Jest testing configuration
├── .eslintrc.json       # ESLint rules
├── .prettierrc.json     # Code formatting rules
└── package.json         # Dependencies and scripts
```

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (for next step - database setup)

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your local configuration.

## Available Scripts

### Development
```bash
npm run dev
```
Starts the development server with hot reload using nodemon.

### Build
```bash
npm run build
```
Compiles TypeScript to JavaScript in the `dist/` directory locally. On Vercel, the same command also runs Prisma generation, applies migrations, and seeds the database.

### Deploy
```bash
npm run deploy
```
Runs Prisma generation, applies pending Prisma migrations, builds the app, and seeds the database in one deploy-oriented command.

### Production
```bash
npm run build
npm start
```
Runs the compiled server.

### Linting & Formatting
```bash
npm run lint              # Check for linting errors
npm run lint:fix         # Fix linting errors automatically
npm run format           # Format code with Prettier
npm run type-check       # Check TypeScript types without building
```

### Testing
```bash
npm test                 # Run tests once
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
```

## Configuration

Environment variables are loaded from `.env`. See `.env.example` for all available options:

- `NODE_ENV` - Environment (development, production)
- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: localhost)
- `API_PREFIX` - API route prefix (default: /api)
- `JWT_SECRET` - Secret key for JWT tokens (required in production)
- `DATABASE_URL` - Database connection string
- `LOG_LEVEL` - Logging level (debug, info, warn, error)
- `CORS_ORIGIN` - Allowed CORS origins

## API Endpoints

### Health Check
- `GET /health` - Returns server health status
- `GET /ready` - Returns readiness status
- `GET /api/health` - Health check with API prefix
- `GET /api/ready` - Readiness check with API prefix

Response example:
```json
{
  "status": "ok",
  "timestamp": "2026-05-12T10:00:00.000Z",
  "uptime": 125.34,
  "environment": "development",
  "version": "0.1.0"
}
```

## Development Workflow

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Make changes** to files in `src/`

3. **Run tests:**
   ```bash
   npm run test:watch
   ```

4. **Lint and format before committing:**
   ```bash
   npm run lint:fix
   npm run format
   ```

## TypeScript Strict Mode

This project uses TypeScript strict mode to catch errors at compile time:
- No implicit `any` types
- Strict null checking
- Strict function types
- All function return types must be explicit

## Error Handling

All errors go through the centralized error handler middleware. The logger provides structured logging at multiple levels (debug, info, warn, error).

## Next Steps

1. **Database Setup** - Configure PostgreSQL and set up an ORM (TypeORM, Prisma)
2. **Authentication** - Implement JWT-based authentication
3. **Organization Management** - Create endpoints for VZW organization management
4. **Member Management** - Add member and role management
5. **Activity Tracking** - Implement activity logging

## Testing Strategy

- Unit tests for utilities and helpers
- Integration tests for routes
- Jest with ts-jest for TypeScript support
- Supertest for HTTP endpoint testing

## Code Quality

- **ESLint** - Static code analysis with TypeScript rules
- **Prettier** - Automatic code formatting
- **TypeScript** - Type safety with strict mode
- **Pre-commit hooks** - Can be added for automated checks

## License

MIT
