// [ARIA] REMOVED: Original MAF applications API route that queried the Application collection.
// Replaced by: /api/services/route.ts which queries the ProtectedService collection.
// This file now re-exports from the services route for backwards compatibility.

// import { NextResponse } from 'next/server';
// import dbConnect from '@/lib/db';
// import Application from '@/lib/models/Application';
// import { logger } from '@/lib/logger';
// import { redis } from '@/lib/redis';
//
// export async function GET() { ... }
// export async function POST(request: Request) { ... }
// export async function PUT(request: Request) { ... }
// export async function DELETE(request: Request) { ... }

// [ARIA] NEW: Re-export services route handlers for /api/applications backwards compatibility
export { GET, POST, PUT, DELETE } from '@/app/api/services/route';
export const dynamic = 'force-dynamic';
