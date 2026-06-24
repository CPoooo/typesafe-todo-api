import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({path: '.env'})

export default defineConfig({
    schema: 'src/db/schema.ts',
    out: 'src/db/migrations', // now this makes me think I should put db up a level? and not in src? who cares for now
    dialect: "postgresql",
    dbCredentials : {
        url: process.env.DATABASE_URL!,
    },
})