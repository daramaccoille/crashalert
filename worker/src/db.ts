import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export const getDb = (connectionString: string) => {
    const client = neon(connectionString);
    return drizzle(client, { schema });
};
