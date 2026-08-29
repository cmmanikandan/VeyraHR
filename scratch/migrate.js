import pg from 'pg';

const connectionString = "postgresql://postgres:CMMANI%4002cm@db.ofkicbtnfhbcxyarpwiu.supabase.co:5432/postgres";

const run = async () => {
  const client = new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log("Connected successfully!");

    console.log("Adding password columns...");
    await client.query("ALTER TABLE public.hr_managers ADD COLUMN IF NOT EXISTS password TEXT;");
    await client.query("ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS password TEXT;");
    await client.query("ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT;");
    console.log("Columns added successfully!");

  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
};

run();
