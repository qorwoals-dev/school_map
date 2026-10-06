import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";

const supabase = createClient(url, key);

async function testConnection() {
  console.log("Checking Supabase tables...");
  const { data, error } = await supabase.from("schools").select("*").limit(5);
  if (error) {
    console.log("Table check status:", error.message);
  } else {
    console.log("Successfully connected! schools count:", data?.length);
  }
}

testConnection();
