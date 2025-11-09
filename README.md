# Volunteer Match

An intelligent volunteer management platform that matches volunteers with events based on their skills, availability, and preferences. Built with Next.js, TypeScript, Prisma, and PostgreSQL.

## 🌟 Features

### For Administrators
- **Event Management**: Create, publish, cancel, and complete volunteer events
- **Smart Matching**: Calculate volunteer matches based on skills, availability, and location
- **Zoom Integration**: Automatically create and manage Zoom meetings for virtual events
- **Volunteer Invitations**: Send email invitations to matched volunteers via SendGrid
- **Dashboard Analytics**: View volunteer counts, event statistics, and recent matches
- **Draft System**: Save events as drafts before publishing

### For Volunteers
- **Personalized Dashboard**: View invitations and registered events
- **Event Invitations**: Accept or decline event invitations
- **Match Scores**: See how well you match with each event
- **Event Details**: View comprehensive information about events you're invited to or registered for

## 🏗️ Architecture

### Layered Architecture
The application follows a clean, layered architecture pattern:

```
├── Presentation Layer (React Components)
│   └── User Interface & Interactions
│
├── API Routes (Next.js API Routes)
│   ├── Request/Response Handling
│   ├── Input Validation (Zod Schemas)
│   └── Authentication & Authorization
│
├── Service Layer
│   ├── Business Logic
│   └── Orchestration
│
├── Repository Layer (Data Access)
│   └── Database Operations (Prisma)
│
└── Database (PostgreSQL)
    └── Data Persistence
```

### Key Architectural Decisions

#### 1. **Service Layer Pattern**
- Business logic is centralized in service classes (`event.service.ts`, `volunteer.service.ts`, `matching.service.ts`, etc.)
- Services orchestrate operations across multiple repositories
- Ensures consistent business rules and makes testing easier

#### 2. **Repository Pattern**
- Data access is abstracted through repository classes
- Each entity has its own repository (e.g., `event.repository.ts`, `volunteer.repository.ts`)
- Decouples business logic from database implementation
- Makes it easier to swap databases or add caching

#### 3. **Validation at API Boundaries**
- Zod schemas validate all incoming requests before reaching services
- Located in `/src/lib/validations/`
- Ensures type safety and data integrity
- Provides clear error messages to clients

#### 4. **Authentication Middleware**
- `withAuth` wrapper handles authentication and authorization
- Role-based access control (ADMIN, VOLUNTEER)
- Session management via NextAuth.js

#### 5. **Error Handling**
- Custom error classes (`NotFoundError`, `ForbiddenError`, etc.)
- Centralized error handling middleware
- Consistent error responses across all endpoints

#### 6. **Type Safety**
- Full TypeScript coverage
- Prisma generates type-safe database clients
- Shared types in `/src/types/` and `/src/lib/types/`

#### 7. **BigInt Handling**
- Zoom meeting IDs stored as BigInt in database
- Serialization utilities handle BigInt → String conversion for JSON responses
- Maintains precision while ensuring compatibility with JSON API

#### 8. **External Service Integration**
- Zoom API calls for meeting creation/updates are currently synchronous
- **Known Technical Debt**: Zoom meeting synchronization in event updates is blocking I/O
- **Future Improvement**: Implement event-driven architecture (message queue/pub-sub) for non-blocking external API calls
- This would improve performance, enable retry logic, and decouple business operations from third-party service availability

## 🚀 Live Demo

The application is deployed on Vercel: **https://volunteer-match-gray.vercel.app**

> **Note on Frontend Development**: This MVP prioritizes backend architecture, API design, and business logic implementation. The frontend is functional but basic. Features like user registration are not implemented in the UI - please use the pre-seeded test accounts below to explore the application. Future iterations would include a more polished UI/UX and complete user flows.

### Test Accounts

**Important**: There is currently no sign-up functionality in the application. You must use one of the pre-seeded accounts below to sign in and explore the system.

#### Admin Account
```
Email: admin@volunteermatch.com
Password: password123
```

**Admin Capabilities:**
- Create and manage events
- Calculate volunteer matches
- Send invitations to volunteers
- Create Zoom meetings for virtual events
- View all volunteers and matches

#### Volunteer Account
```
Email: john@example.com
Password: password123
```

**Volunteer Capabilities:**
- View pending invitations
- Accept or decline event invitations
- See match scores
- View registered events

#### Additional Volunteer Account
```
Email: jackbdr+volunteer1@icloud.com
Password: password123
```

## 🛠️ Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **React Hook Form**: Form state management
- **Zod**: Schema validation

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **NextAuth.js**: Authentication
- **Prisma**: Type-safe ORM
- **PostgreSQL**: Primary database
- **bcrypt**: Password hashing

### External Services
- **Zoom API**: Virtual meeting integration
- **SendGrid**: Email notifications
- **Vercel**: Hosting and deployment

## 📦 Local Development Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Zoom OAuth app (for meeting creation)
- SendGrid account (for emails)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd volunteer-match
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Zoom OAuth
ZOOM_ACCOUNT_ID="your-zoom-account-id"
ZOOM_CLIENT_ID="your-zoom-client-id"
ZOOM_CLIENT_SECRET="your-zoom-client-secret"

# SendGrid
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
SENDGRID_FROM_NAME="Volunteer Match"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. **Set up the database**
```bash
# Run migrations
npx prisma migrate deploy

# Seed the database
npm run seed
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 Database Schema

### Core Entities
- **User**: Authentication and profile information
- **Volunteer**: Volunteer-specific data (skills, availability, preferences)
- **Event**: Volunteer events with details and status
- **EventMatch**: Matching records between volunteers and events with scores

### Event Status Flow
```
DRAFT → PUBLISHED → COMPLETED
           ↓
       CANCELLED
```

### Match Status Flow
```
PENDING → ACCEPTED (volunteer registered)
   ↓
DECLINED (volunteer declined)
```

## 🧪 Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run seed         # Seed database with test data
npx prisma studio    # Open Prisma Studio (database GUI)
npx prisma migrate dev  # Create new migration

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

## 🔮 Future Enhancements

The following features are not implemented in the current MVP but are designed for future implementation:

### Volunteer-Initiated Search
- Allow volunteers to search and browse all published events
- Filter by location, skills, date, and cause
- Register for events without admin invitation

### Event-Driven Architecture for External Services
- **Asynchronous Zoom Meeting Synchronization**: Implement message queue (e.g., RabbitMQ, AWS SQS, or Redis) to handle Zoom meeting creation/updates asynchronously
- **Batch Email Processing**: Queue-based email system for sending bulk invitations
- **Non-blocking I/O**: Decouple business operations from external API calls for better performance
- **Retry Logic**: Automatic retries for failed external service calls
- **Email Delivery Tracking**: Monitor delivery status and handle bounces

### Enhanced Matching Algorithm
- Machine learning-based match scoring
- Consider volunteer history and feedback
- Time-based availability matching (specific hours, not just time slots)

### Reporting & Analytics
- Event attendance tracking
- Volunteer engagement metrics
- Export capabilities for reports

### Mobile Application
- Native iOS/Android apps
- Push notifications for new invitations
- Quick event check-in

### Multi-tenant Support
- Support multiple organizations
- Organization-specific branding
- Separate volunteer pools per organization

### API Documentation
- OpenAPI/Swagger documentation for all endpoints
- Interactive API explorer
- Request/response examples
- Authentication flow documentation

### Comprehensive Testing Coverage
- **Unit Tests**: Achieve 100% code coverage for all services, repositories, and utilities
- **End-to-End Tests**: Playwright-based E2E tests for every API endpoint
- **Integration Tests**: Test full flows from API to database
- **Component Tests**: React component testing with user interaction scenarios
