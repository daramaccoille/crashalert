import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// We can put the schema here or import it. 
// For simplicity in this structure, I'll assume we duplicate schema or point to it.
// Ideally, we move `drizzle` folder to root context or make it a shared package.
// For now, let's just strictly type `any` or minimal schema to avoid build errors until we unify.
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
