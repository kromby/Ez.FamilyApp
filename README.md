# ez.familyapp

A private family communication app for iOS and Android. Channel-based messaging, location check-ins, and shared task lists — all in one place.

## Prerequisites

- Node.js 18+
- An Azure SQL Database ([free tier](https://learn.microsoft.com/en-us/azure/azure-sql/database/free-offer) works)
- Expo CLI (`npx expo`)
- iOS Simulator (Mac) or Android Emulator, or the Expo Go app on your phone

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your Azure SQL credentials and a JWT secret:

```
PORT=3000
JWT_SECRET=some-random-secret
AZURE_SQL_SERVER=your-server.database.windows.net
AZURE_SQL_DATABASE=familyapp
AZURE_SQL_USER=your-sql-user
AZURE_SQL_PASSWORD=your-sql-password
NODE_ENV=development
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@familyapp.example.com
```

Run the schema against your Azure SQL database:

```bash
sqlcmd -S your-server.database.windows.net -d familyapp -U your-sql-user -P your-sql-password -i src/db/schema.sql
```

Start the backend:

```bash
npm run dev
```

> In development mode (`NODE_ENV=development`), OTP codes are logged to the console so you don't need real SMTP credentials.

### 2. Mobile App

```bash
# From the project root
npm install
```

Create a `.env` file in the project root:

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

> If using a physical device, replace `localhost` with your machine's local IP address.

Start the app:

```bash
npx expo start
```

Press `i` for iOS Simulator, `a` for Android Emulator, or scan the QR code with Expo Go.

## Project Structure

```
├── backend/           # Express API (Azure SQL, OTP auth, family management)
│   └── src/
│       ├── db/        # Schema and connection
│       ├── lib/       # Family code generation, mailer
│       ├── middleware/ # JWT auth
│       └── routes/    # Auth, families, users
├── src/
│   ├── api/           # Typed API client
│   ├── app/
│   │   ├── (auth)/    # Onboarding screens (welcome, create, join, OTP, etc.)
│   │   └── (tabs)/    # Tab screens (home, messages, tasks, location, profile)
│   ├── constants/     # Design tokens (colors, spacing, typography)
│   └── stores/        # Session store (Zustand + SecureStore)
└── .planning/         # GSD planning artifacts
```
