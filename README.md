# Proof Arrive Dashboard

A comprehensive dashboard application built with Vite, React, TypeScript, Tailwind CSS, and shadcn/ui.

## Project Setup

This project has been initialized with the following stack:

### ✅ Completed Setup Steps

1. **Vite + React + TypeScript Project** - Initialized with React and TypeScript template
2. **Core Dependencies** - Installed all required packages:
   - React Router DOM for routing
   - TanStack React Query for data fetching
   - Zustand for state management
   - Axios for HTTP requests
   - React Hook Form + Zod for form handling
   - Lucide React for icons
   - QRCode React for QR code generation
   - Date-fns for date formatting
   - clsx and tailwind-merge for className utilities

3. **Tailwind CSS** - Configured with:
   - Custom color scheme using CSS variables
   - Dark mode support
   - Tailwind Animate plugin
   - shadcn/ui compatible configuration

4. **shadcn/ui** - Configured with:
   - components.json configuration file
   - Utility functions (cn, formatDate, formatNumber)
   - Ready for component installation

5. **Project Structure** - Created organized directory structure:
   ```
   src/
   ├── api/              # API client and endpoints
   ├── components/       # React components
   │   ├── ui/          # shadcn/ui components (to be added)
   │   ├── layout/      # Layout components
   │   ├── dashboard/   # Dashboard-specific components
   │   └── common/      # Shared components
   ├── hooks/           # Custom React hooks
   ├── lib/             # Utility functions
   ├── stores/          # Zustand stores
   ├── types/           # TypeScript types
   ├── routes/          # Route definitions
   └── pages/           # Page components
   ```

6. **Environment Configuration** - Created:
   - `.env` with API base URL
   - `.env.example` as template

7. **Core Setup Files** - Created utility files:
   - `src/lib/utils.ts` - General utilities
   - `src/lib/cn.ts` - className utility

8. **API Client Setup** - Complete with:
   - Axios instance with base URL configuration
   - Request interceptor for JWT token injection
   - Response interceptor for token refresh on 401 errors
   - Auth API endpoints (login, refresh, logout)
   - Dashboard API endpoints (all CRUD operations)
   - TypeScript types for all API responses

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port Vite assigns).

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_APP_NAME=Proof Arrive Dashboard
```

## Next Steps

1. **Install shadcn/ui Components**:
   ```bash
   npx shadcn-ui@latest add button
   npx shadcn-ui@latest add card
   npx shadcn-ui@latest add table
   # ... add other components as needed
   ```

2. **Create Pages**:
   - Login page
   - Dashboard overview
   - Entity list pages (Users, Vehicles, Centers, etc.)

3. **Set up Routing**:
   - Configure React Router
   - Add protected routes
   - Set up navigation

4. **Implement Features**:
   - Authentication flow
   - Data tables with pagination
   - Search and filtering
   - QR code generation UI

## Project Structure Details

### API Client (`src/api/`)

- **client.ts**: Axios instance with interceptors for authentication
- **auth.ts**: Authentication API endpoints
- **dashboard.ts**: Dashboard API endpoints

### State Management (`src/stores/`)

- **auth.store.ts**: Zustand store for authentication state with persistence

### Types (`src/types/`)

- **api.types.ts**: TypeScript types for API requests and responses
- **index.ts**: Type exports

### Utilities (`src/lib/`)

- **utils.ts**: General utility functions (formatDate, formatNumber, cn)
- **cn.ts**: className utility for Tailwind CSS class merging

## Technologies Used

- **Vite** - Build tool and dev server
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **Zustand** - State management
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## License

Private project
