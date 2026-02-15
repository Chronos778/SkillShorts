// Run all Supabase migrations via direct PostgreSQL connection
// Usage: node run-migrations.mjs

import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { Client } = pg;

const PROJECT_REF = 'gnijtwraujzsvdzsugixo';
const DB_PASSWORD = 'UKe6te6TceL8A3O5';

// Try multiple Supabase connection formats (region varies per project)
const DB_URLS = [
    `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-us-west-2.pooler.supabase.com:5432/postgres`,
];

const MIGRATIONS = [
    '000_initial_schema.sql',
    '001_video_validation.sql',
    '002_quiz_enforcement.sql',
    '003_progress_enforcement.sql',
    '004_feature_flags_rls.sql',
    '005_video_feedback.sql',
    '006_storage_buckets.sql',
    '006_creator_delete_policies.sql',
    '007_delete_video_function.sql',
    '008_fix_delete_policy.sql',
    '009_feedback_policies.sql',
    '010_fix_badges_rls.sql',
    '011_fix_clerk_rls.sql',
];

async function tryConnect(url) {
    const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
    await client.connect();
    return client;
}

async function main() {
    console.log('🚀 Supabase Migration Runner');
    console.log('='.repeat(50) + '\n');

    // Try each connection URL
    let client = null;
    for (const url of DB_URLS) {
        const masked = url.replace(DB_PASSWORD, '****');
        process.stdout.write(`📡 Trying ${masked.split('@')[1]?.split('/')[0] || masked}...`);
        try {
            client = await tryConnect(url);
            console.log(' ✅ Connected!');
            break;
        } catch (err) {
            console.log(` ❌ ${err.message.substring(0, 60)}`);
        }
    }

    if (!client) {
        console.log('\n❌ Could not connect to any Supabase DB endpoint.');
        console.log('   Please check your DB password and project ref in .env');
        console.log('   You can find the connection string at:');
        console.log('   Supabase Dashboard → Project Settings → Database → Connection string');
        process.exit(1);
    }

    console.log('');

    let succeeded = 0;
    let failed = 0;
    const errors = [];

    for (const filename of MIGRATIONS) {
        const filepath = join(__dirname, 'supabase', 'migrations', filename);
        let sql;
        try {
            sql = readFileSync(filepath, 'utf-8');
        } catch {
            console.log(`❌ [${filename}] — File not found!`);
            failed++;
            continue;
        }

        process.stdout.write(`⏳ ${filename}...`);

        try {
            await client.query(sql);
            console.log(` ✅`);
            succeeded++;
        } catch (err) {
            const msg = err.message || String(err);
            // "already exists" and "duplicate key" errors are OK (idempotent)
            if (msg.includes('already exists') || msg.includes('duplicate key')) {
                console.log(` ⚠️  Already applied (OK)`);
                succeeded++;
            } else {
                console.log(` ❌`);
                console.log(`   Error: ${msg.substring(0, 200)}\n`);
                errors.push({ file: filename, error: msg });
                failed++;
            }
        }
    }

    await client.end();

    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 Results: ${succeeded}/${MIGRATIONS.length} succeeded, ${failed} failed`);

    if (errors.length > 0) {
        console.log(`\n⚠️  Failed migrations:`);
        for (const e of errors) {
            console.log(`   - ${e.file}`);
            console.log(`     ${e.error.substring(0, 200)}\n`);
        }
    }

    if (failed === 0) {
        console.log('\n🎉 All migrations applied successfully!');
    }
}

main().catch(console.error);
