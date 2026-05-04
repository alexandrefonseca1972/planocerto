import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

const SUPABASE_URL = "https://tzpcjhrjzbkjkocjddwg.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6cGNqaHJqemJramtvY2pkZHdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzc2NzMxMCwiZXhwIjoyMDkzMzQzMzEwfQ.vtKXpXspZu-o2-u6az0Vx2XCvnQTrs1VDhCKUvHuLHI";

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ADMIN_EMAIL = "alexandre.fonseca@live.com";
const DOCS_DIR = path.resolve(__dirname, "..", "docs");

interface PlanHeader {
  unit: string;
  director: string;
  goal: string;
}

interface ActionRow {
  number: string;
  parentNumber: string | null;
  action: string;
  why: string;
  where: string;
  responsible: string;
  planned_start: string;
  planned_end: string;
  actual_start: string;
  actual_end: string;
  cost: string;
  expected_result: string;
  actual_result: string;
  status: number;
  observations: string;
  sort_order: number;
}

function parseExcel(filePath: string): { header: PlanHeader; rows: ActionRow[] } {
  const workbook = XLSX.readFile(filePath, { type: "file" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  const header: PlanHeader = { unit: "", director: "", goal: "" };
  const rows: ActionRow[] = [];
  let sortCounter = 0;
  let foundHeader = false;

  for (const row of data) {
    const r = row.map((c) => String(c).trim());

    // Extract header info
    if (r[0] === "UNIDADE:" || r[1] === "UNIDADE:") header.unit = r[1] || r[0];
    if (r[0] === "DIRETOR:" || r[1] === "DIRETOR:" || r[0] === "LÍDER COMERCIAL:" || r[1] === "LÍDER COMERCIAL:") {
      header.director = r[1] || r[0];
    }
    if (r[0] === "META:" || r[1] === "META:" || r[0].startsWith("META")) header.goal = r[1] || r[0];

    // Find header row
    if (r[0] === "Nº." || r[0] === "Nº") { foundHeader = true; continue; }

    if (!foundHeader) continue;

    const num = r[0];
    if (!num || num === "" || num === "No." || num === "Nº") continue;

    // Determine parent
    let parentNumber: string | null = null;
    if (num.includes(".")) {
      parentNumber = num.split(".").slice(0, -1).join(".");
    }

    // Excel dates may be serial numbers
    const parseExcelDate = (v: string): string => {
      if (!v) return "";
      const num = Number(v);
      if (!isNaN(num) && num > 30000 && num < 80000) {
        const date = new Date((num - 25569) * 86400 * 1000);
        return date.toISOString().split("T")[0];
      }
      // Try parsing as string date (e.g., "4/28/26")
      const parts = v.split("/");
      if (parts.length === 3) {
        const m = parseInt(parts[0]);
        const d = parseInt(parts[1]);
        let y = parseInt(parts[2]);
        if (y < 100) y += 2000;
        if (!isNaN(m) && !isNaN(d)) return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
      return "";
    };

    const action = r[1] || "";
    // Skip rows that are just group labels with no actual action content
    // But keep group headers (single digit numbers) without sub-items

    const statusStr = r[13] || r[12] || "1";
    let status = parseInt(statusStr) || 1;
    if (status < 1 || status > 5) status = 1;

    rows.push({
      number: num,
      parentNumber,
      action: action || r[1] || "",
      why: r[2] || "",
      where: r[3] || "",
      responsible: r[4] || "",
      planned_start: parseExcelDate(r[5] || ""),
      planned_end: parseExcelDate(r[6] || ""),
      actual_start: parseExcelDate(r[7] || ""),
      actual_end: parseExcelDate(r[8] || ""),
      cost: r[9] || "",
      expected_result: r[10] || "",
      actual_result: r[11] || "",
      status,
      observations: r[14] || "",
      sort_order: ++sortCounter,
    });
  }

  return { header, rows };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  // Get admin user ID
  const { data: profile } = await adminClient.from("profiles").select("id").eq("email", ADMIN_EMAIL).single();
  if (!profile) { console.error("Admin not found"); process.exit(1); }
  const adminId = profile.id;

  // Delete existing tenant "planocerto" and all its cascade data
  console.log("🧹 Limpando dados antigos...");
  const { data: oldTenant } = await adminClient.from("tenants").select("id").eq("slug", "planocerto").single();
  if (oldTenant) {
    await adminClient.from("tenants").delete().eq("id", oldTenant.id);
    console.log("   ✅ Tenant 'planocerto' removido");
  }

  // Process each Excel file
  const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith(".xlsx")).sort();

  let totalItems = 0;
  let tenantCount = 0;

  for (const file of files) {
    const filePath = path.join(DOCS_DIR, file);
    const fileName = path.basename(file, ".xlsx");

    // Skip the old "planodeação" since it's a duplicate of Rio Branco
    if (fileName === "planodeação") {
      console.log(`⏭️  Pulando "${fileName}" (duplicata de Rio Branco)`);
      continue;
    }

    console.log(`\n📄 Processando: ${fileName}`);
    const { header, rows } = parseExcel(filePath);

    if (!header.unit) {
      console.log(`   ⚠️  Sem unidade encontrada, pulando`);
      continue;
    }

    const slug = slugify(header.unit);
    const tenantName = header.unit;

    // Create tenant
    const { data: tenant, error: tenantError } = await adminClient
      .from("tenants")
      .insert({ name: tenantName, slug, plan: "enterprise" })
      .select()
      .single();

    if (tenantError) {
      console.log(`   ❌ Erro ao criar tenant: ${tenantError.message}`);
      continue;
    }

    tenantCount++;
    console.log(`   🏢 Tenant criado: ${tenantName} (${slug})`);

    // Add admin as owner
    await adminClient.from("tenant_members").insert({
      tenant_id: tenant.id, user_id: adminId, role: "owner",
    });

    // Create action plan
    const { data: plan, error: planError } = await adminClient
      .from("action_plans")
      .insert({
        tenant_id: tenant.id,
        title: `Plano de Ação — ${tenantName}`,
        unit: header.unit,
        director: header.director,
        goal: header.goal,
        user_id: adminId,
      })
      .select()
      .single();

    if (planError || !plan) {
      console.log(`   ❌ Erro ao criar plano: ${planError?.message}`);
      continue;
    }

    console.log(`   📋 Plano criado: "${plan.title}"`);
    console.log(`   👤 ${header.director} | 🎯 ${header.goal}`);

    // Import action items
    const numberToId = new Map<string, string>();
    let itemCount = 0;

    for (const row of rows) {
      const parentId = row.parentNumber ? numberToId.get(row.parentNumber) || null : null;

      const { data: item, error: itemError } = await adminClient
        .from("action_items")
        .insert({
          plan_id: plan.id,
          parent_id: parentId,
          number: row.number,
          sort_order: row.sort_order,
          action: row.action || `(${row.number})`,
          why: row.why,
          where: row.where,
          responsible: row.responsible,
          planned_start: row.planned_start || null,
          planned_end: row.planned_end || null,
          actual_start: row.actual_start || null,
          actual_end: row.actual_end || null,
          cost: row.cost,
          expected_result: row.expected_result,
          actual_result: row.actual_result,
          status: row.status,
          observations: row.observations,
        })
        .select()
        .single();

      if (itemError) {
        console.log(`   ⚠️  Erro no item ${row.number}: ${itemError.message}`);
      } else if (item) {
        numberToId.set(row.number, item.id);
        itemCount++;
      }
    }

    totalItems += itemCount;
    console.log(`   ✅ ${itemCount} itens importados`);
  }

  console.log(`\n🎉 Importação concluída!`);
  console.log(`   🏢 ${tenantCount} tenants criados`);
  console.log(`   📝 ${totalItems} itens importados`);
  console.log(`   👤 Admin associado como owner de todos os tenants`);
}

main().catch(console.error);
