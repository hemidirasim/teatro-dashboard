# Teatro Admin Panel

Modern admin panel built with Next.js 16+, React 19+, TypeScript, and Prisma for managing Teatro database.

## Features

- 🔐 NextAuth.js authentication
- 📊 Dynamic database table management
- ✏️ Full CRUD operations for all tables
- 🎨 Modern UI with Tailwind CSS and shadcn/ui
- 🌓 Dark/Light mode support
- 📝 Form validation with react-hook-form and Zod
- 🔍 Real-time database introspection

## Tech Stack

- **Frontend**: Next.js 16+ (App Router), React 19+, TypeScript 5+
- **UI**: Tailwind CSS 3.4+, Radix UI, shadcn/ui, Lucide React
- **Forms**: react-hook-form 7+, Zod 4+
- **Backend**: Prisma 6+, Next.js API Routes
- **Auth**: NextAuth.js 4+, bcryptjs
- **HTTP**: Axios 1+
- **Utils**: date-fns, Sonner (toast notifications)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Access to the MySQL database

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the root directory:
```
DATABASE_URL="mysql://teatrd_1:VeESdQ9XgG1861Rh@68.183.173.136:3306/teatrd_db1"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3066"
```

3. Pull database schema:
```bash
npx prisma db pull
npx prisma generate
```

4. Create an admin user (optional):
You can create an admin user directly in the database or use Prisma Studio:
```bash
npx prisma studio
```

To create a user manually, hash a password using bcrypt and insert into the User table.

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3066](http://localhost:3066) in your browser.

## Database Connection

The admin panel connects to:
- **Host**: 68.183.173.136
- **Port**: 3306
- **Database**: teatrd_db1
- **Username**: teatrd_1

**Note**: Make sure your IP address is whitelisted in the database server's firewall settings.

## Project Structure

```
teatro-dash/
├── app/
│   ├── admin/          # Admin panel pages
│   │   ├── tables/     # Dynamic table management
│   │   ├── users/      # User management
│   │   └── settings/   # Settings page
│   ├── api/            # API routes
│   │   ├── auth/       # NextAuth routes
│   │   └── tables/     # Table CRUD API
│   └── login/          # Login page
├── components/
│   ├── ui/             # shadcn/ui components
│   └── ...             # Custom components
├── lib/
│   ├── prisma.ts       # Prisma client
│   └── utils.ts        # Utility functions
└── prisma/
    └── schema.prisma   # Database schema
```

## Usage

### Authentication

1. Navigate to `/login`
2. Enter your credentials
3. You'll be redirected to the admin dashboard

### Managing Tables

1. Go to **Database Tables** in the sidebar
2. Click on any table to view its data
3. Use **Add New** to create records
4. Use **Edit** and **Delete** actions on each row

### Creating Admin Users

You can create admin users through:
- Prisma Studio: `npx prisma studio`
- Direct database access
- API endpoint (if implemented)

To hash a password for a new user:
```javascript
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash('your-password', 10);
```

## Development

### Database Schema Updates

When the database schema changes:
```bash
npx prisma db pull
npx prisma generate
```

### Building for Production

```bash
npm run build
npm start
```

## Security Notes

- Change `NEXTAUTH_SECRET` in production
- Use strong passwords for admin users
- Ensure database credentials are secure
- Consider implementing rate limiting
- Add IP whitelisting for production

## License

Private project for Teatro management.

