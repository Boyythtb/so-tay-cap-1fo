// Cloudflare Pages Functions - REST API for QA/QC 1FO Playbook
// Database: Cloudflare D1 (Serverless SQLite at the edge)

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json; charset=utf-8"
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS
  });
}

async function ensureTable(db) {
  if (!db) return;
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT,
      cable_lot TEXT,
      auditor TEXT,
      factory TEXT,
      pre_visit_state TEXT,
      test_status TEXT,
      test_notes TEXT,
      doc_checked TEXT,
      notes TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `).run();
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, "");
  const segments = path.split("/").filter(Boolean);
  const method = request.method.toUpperCase();

  if (method === "OPTIONS") {
    return onRequestOptions();
  }

  const db = env.DB;
  if (!db) {
    return jsonResponse({
      error: "D1 database binding 'DB' is missing in environment.",
      has_db: false
    }, 500);
  }

  try {
    await ensureTable(db);

    // GET /api/health
    if (segments.length === 0 || segments[0] === "health") {
      const countRes = await db.prepare("SELECT COUNT(*) as total FROM sessions").first();
      return jsonResponse({
        status: "ok",
        service: "qa-qc-1fo-api",
        time: new Date().toISOString(),
        total_sessions: countRes ? countRes.total : 0
      });
    }

    // Routes: /api/sessions...
    if (segments[0] === "sessions") {
      // 1. GET /api/sessions -> List all sessions
      if (segments.length === 1 && method === "GET") {
        const { results } = await db.prepare(`
          SELECT id, title, cable_lot, auditor, factory, pre_visit_state, test_status, test_notes, doc_checked, notes, created_at, updated_at 
          FROM sessions 
          ORDER BY updated_at DESC
        `).all();

        const summary = (results || []).map(row => {
          let testStatus = {};
          let preVisit = {};
          let docChecked = {};
          try { testStatus = JSON.parse(row.test_status || "{}"); } catch (e) {}
          try { preVisit = JSON.parse(row.pre_visit_state || "{}"); } catch (e) {}
          try { docChecked = JSON.parse(row.doc_checked || "{}"); } catch (e) {}

          const passCount = Object.values(testStatus).filter(v => v === "PASS").length;
          const failCount = Object.values(testStatus).filter(v => v === "FAIL").length;
          const testedCount = Object.values(testStatus).filter(Boolean).length;

          return {
            id: row.id,
            title: row.title || "Chưa đặt tên",
            cable_lot: row.cable_lot || "",
            auditor: row.auditor || "",
            factory: row.factory || "",
            notes: row.notes || "",
            created_at: row.created_at,
            updated_at: row.updated_at,
            passCount,
            failCount,
            testedCount
          };
        });

        return jsonResponse({ success: true, sessions: summary });
      }

      // 2. GET /api/sessions/:id -> Get single session
      if (segments.length === 2 && method === "GET") {
        const id = decodeURIComponent(segments[1]);
        const row = await db.prepare("SELECT * FROM sessions WHERE id = ?").bind(id).first();

        if (!row) {
          return jsonResponse({ success: false, error: "Session not found", id }, 404);
        }

        return jsonResponse({
          success: true,
          session: {
            id: row.id,
            title: row.title || "",
            cable_lot: row.cable_lot || "",
            auditor: row.auditor || "",
            factory: row.factory || "",
            pre_visit_state: JSON.parse(row.pre_visit_state || "{}"),
            test_status: JSON.parse(row.test_status || "{}"),
            test_notes: JSON.parse(row.test_notes || "{}"),
            doc_checked: JSON.parse(row.doc_checked || "{}"),
            notes: row.notes || "",
            created_at: row.created_at,
            updated_at: row.updated_at
          }
        });
      }

      // 3. POST /api/sessions -> Create or update session
      if (method === "POST" || method === "PUT") {
        const body = await request.json();
        const id = (body.id && String(body.id).trim()) || "default";
        const title = body.title || "Nghiệm Thu Mẫu 01";
        const cable_lot = body.cable_lot || "";
        const auditor = body.auditor || "";
        const factory = body.factory || "";
        const pre_visit_state = JSON.stringify(body.pre_visit_state || {});
        const test_status = JSON.stringify(body.test_status || {});
        const test_notes = JSON.stringify(body.test_notes || {});
        const doc_checked = JSON.stringify(body.doc_checked || {});
        const notes = body.notes || "";
        const now = new Date().toISOString();

        await db.prepare(`
          INSERT INTO sessions (id, title, cable_lot, auditor, factory, pre_visit_state, test_status, test_notes, doc_checked, notes, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            cable_lot = excluded.cable_lot,
            auditor = excluded.auditor,
            factory = excluded.factory,
            pre_visit_state = excluded.pre_visit_state,
            test_status = excluded.test_status,
            test_notes = excluded.test_notes,
            doc_checked = excluded.doc_checked,
            notes = excluded.notes,
            updated_at = excluded.updated_at
        `).bind(id, title, cable_lot, auditor, factory, pre_visit_state, test_status, test_notes, doc_checked, notes, now, now).run();

        return jsonResponse({
          success: true,
          message: "Saved successfully",
          id,
          updated_at: now
        });
      }

      // 4. DELETE /api/sessions/:id -> Delete session
      if (segments.length === 2 && method === "DELETE") {
        const id = decodeURIComponent(segments[1]);
        if (id === "default") {
          // Reset default rather than delete
          const now = new Date().toISOString();
          await db.prepare(`
            UPDATE sessions 
            SET title = 'Mặc định', cable_lot = '', auditor = '', factory = '', pre_visit_state = '{}', test_status = '{}', test_notes = '{}', doc_checked = '{}', notes = '', updated_at = ?
            WHERE id = 'default'
          `).bind(now).run();
          return jsonResponse({ success: true, message: "Default session reset", id });
        }

        await db.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
        return jsonResponse({ success: true, message: "Session deleted", id });
      }
    }

    return jsonResponse({ error: "Endpoint not found" }, 404);
  } catch (err) {
    return jsonResponse({
      success: false,
      error: err.message || String(err),
      stack: err.stack
    }, 500);
  }
}
