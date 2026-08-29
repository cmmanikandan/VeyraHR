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

    console.log("Creating documents table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.documents (
        id VARCHAR(128) PRIMARY KEY,
        employee_id VARCHAR(128) NOT NULL,
        category VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        doc_number VARCHAR(100),
        file_name VARCHAR(255) NOT NULL,
        file_size VARCHAR(50) NOT NULL,
        issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
        expiry_date DATE,
        status VARCHAR(30) DEFAULT 'Verified',
        verification_hash VARCHAR(128),
        custom_image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("Table created.");

    console.log("Enabling RLS and policies...");
    await client.query("ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;");
    await client.query("DROP POLICY IF EXISTS \"Public documents\" ON public.documents;");
    await client.query("CREATE POLICY \"Public documents\" ON public.documents FOR ALL USING (true) WITH CHECK (true);");
    console.log("Policies configured successfully!");

  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
};

run();
