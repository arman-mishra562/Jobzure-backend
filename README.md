# JobZure Backend API 🚀

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.18%2B-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0%2B-orange.svg)](https://www.prisma.io/)

The backend API for JobZure platform, providing user management, company listings, and authentication services.

## Features ✨

- **JWT Authentication** 🔐
- **Two-factor authentication** 📱
- Admin management system 👔
- Company listing management 🏢
- User personal details validation 📄
- REST API endpoints
- PostgreSQL database integration 🐘
- TypeScript support 📦

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL 15+
- PNPM (recommended)

### Installation

```bash
npm i -g pnpm
# Clone repository
git clone https://github.com/Zylentrix/jobzure_backend.git

# Navigate to project directory
cd jobzure-backend

# Install dependencies
pnpm install

# Set up environment variables
create .env
```

## Database Setup

- already provided PostgreSQL database

Update .env with your database credentials

Run migrations:

```bash
npx prisma migrate dev
npx prisma generate
```

### Seed the Database

After running migrations, seed the database with initial data:

```bash
# Run the seed script
pnpm run seed
```

This will populate the database with common values for:

- Target job locations (USA, Canada, UK, etc.)
- Interested roles (Full Stack Developer, Frontend Developer, etc.)
- Interested industries (Education, Healthcare, Finance, etc.)

## Environment Variables 🛠️

Create a `.env` file in the root directory with the following variables:

and env variables shared by office mail

### Running the Application

```bash
# Build the application
pnpm run build

# Start the development server
pnpm run dev
```

### Available Scripts

- `pnpm run build`: Build the application
- `pnpm run dev`: Run the development server
- `pnpm run seed`: Seed the database with initial data
- `pnpm run migrate`: Run database migrations
- `pnpm run generate`: Generate Prisma client

## API Documentation 📚

Base URL: http://localhost:8001/api/v1

View Postman Documentation [here](https://documenter.getpostman.com/view/19229297/UVe8858e) 🔗

Key Endpoints

`Admin Routes 👨💼`

```
POST /admin/register

POST /admin/login

POST /admin/companyListing
```

`User Routes 👤`

```
POST /user/register

GET /user/verify

POST /user/re-verify

POST /user/login

POST /user/logout



POST /user/personalDetails

GET /user/getpersonalDetails
```

## Code Standards

- Keep functions small and focused
- Add JSDoc comments for complex logic
- Use Prisma best practices for database operations
- Include appropriate error handling
- Validate all user input

## Testing Requirements

- Add unit tests for new features
- Update tests when changing existing code
- Ensure all tests pass before submitting PR

## Reporting Issues

If you encounter any issues or have questions, please open an issue in the [GitHub repository](https://github.com/Zylentrix/jobzure_backend/issues).
