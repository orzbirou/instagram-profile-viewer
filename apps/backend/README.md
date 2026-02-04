# Instagram Profile Viewer - Backend

NestJS backend API that serves as a middleware layer between the frontend and the IMAI Instagram API.

## Environment Variables

The following environment variables are required to run the backend:

### Required

- **`IMAI_API_KEY`** (required): API key for authenticating with the IMAI service.
  
  Example:
  ```bash
  IMAI_API_KEY=<YOUR_API_KEY>
  ```

### Optional

- **`IMAI_BASE_URL`** (optional): Base URL for the IMAI API. Defaults to `https://imai.co` if not specified.
  
  Example:
  ```bash
  IMAI_BASE_URL=https://imai.co
  ```

- **`PORT`** (optional): Port for the backend server. Defaults to `3000` if not specified.
  
  Example:
  ```bash
  PORT=3000
  ```

## Setup

1. Create a `.env` file in the `apps/backend` directory with the required environment variables:

   ```bash
   IMAI_API_KEY=<YOUR_API_KEY>
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm run start:dev
   ```

## API Endpoints

- **`GET /`** - Welcome message
- **`GET /health`** - Health check endpoint
- **`GET /search?query=<keyword>`** - Search Instagram users by keyword
- **`GET /profile/:username`** - Get Instagram user profile information

## Error Handling

- **429 Too Many Requests**: Rate limit exceeded from upstream API
- **502 Bad Gateway**: Upstream service error or unavailable
