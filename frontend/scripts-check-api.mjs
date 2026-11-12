// Ejemplo: CONTROLSTOCK_API=http://localhost:3000 node scripts-check-api.mjs
const host = (process.env.CONTROLSTOCK_API || 'http://localhost:3000').replace(/\/$/, '')
for (const path of ['/api/test-db', '/api/categorias', '/api/productos']) {
  try {
    const r = await fetch(host + path, { signal: AbortSignal.timeout(4500) })
    console.log(`${r.status} ${path}`, (await r.text()).slice(0, 160))
    if (!r.ok) process.exitCode = 1
  } catch (e) { console.error(`FALLO ${path}:`, e.message); process.exitCode = 1 }
}
