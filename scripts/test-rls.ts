import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

const A_EMAIL = process.env.TEST_USER_A_EMAIL!;
const A_PASS = process.env.TEST_USER_A_PASSWORD!;
const B_EMAIL = process.env.TEST_USER_B_EMAIL!;
const B_PASS = process.env.TEST_USER_B_PASSWORD!;

function client() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

async function login(email: string, password: string) {
  const c = client();
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Login falhou (${email}): ${error.message}`);

  const me = await c.auth.getUser();
  if (me.error || !me.data.user) throw new Error(`getUser falhou (${email})`);
  return { c, userId: me.data.user.id };
}

async function main() {
  const a = await login(A_EMAIL, A_PASS);
  const b = await login(B_EMAIL, B_PASS);

  console.log("A:", a.userId);
  console.log("B:", b.userId);

  const own = await a.c.from("resumes").insert({
    user_id: a.userId,
    title: "CV A proprio",
    template_id: "template-frontend-jr",
    data: { test: "own-insert" },
    file_name: "a.docx",
  });

  if (own.error) throw new Error(`Insert proprio A falhou: ${own.error.message}`);
  console.log("OK: insert próprio permitido");

  const cross = await a.c.from("resumes").insert({
    user_id: b.userId,
    title: "CV A no B",
    template_id: "template-frontend-jr",
    data: { test: "cross-insert" },
    file_name: "x.docx",
  });

  if (!cross.error) throw new Error("RLS FALHOU: A inseriu no user_id de B");
  console.log("OK: RLS bloqueou insert cruzado ->", cross.error.message);

  const listA = await a.c.from("resumes").select("id,user_id,title");
  if (listA.error) throw new Error(`Select A falhou: ${listA.error.message}`);

  const onlyA = (listA.data ?? []).every((r) => r.user_id === a.userId);
  console.log("A só vê dados do A?", onlyA ? "SIM" : "NAO");
}

main().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(1);
});
