// PM2 process config for Jelastic (or any Linux server)
// Usage:
//   pm2 start ecosystem.config.js --env production
//   pm2 save && pm2 startup   (run once to survive reboots)

module.exports = {
  apps: [
    {
      name: 'tripzync',

      // Standalone build — no next start needed, just plain node
      script: '.next/standalone/server.js',

      // Keep 2 instances if server has ≥ 2 vCPUs; set to 1 for a small VPS
      instances: 1,
      exec_mode: 'fork',

      // Restart if memory exceeds 512 MB
      max_memory_restart: '512M',

      // Restart on crash, but stop retrying after 10 failures in 60 s
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',

      // Default env — PORT 3000 always applied regardless of --env flag
      env: {
        PORT: 3000,
      },

      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,

        // ── Copy these from your .env.local ──────────────────────────────────
        // Set them in the Jelastic dashboard (Variables tab) instead of here.
        // Listed here only as documentation of what's required.
        //
        // DATABASE_URL=
        // AUTH_SECRET=
        // AUTH_GOOGLE_ID=
        // AUTH_GOOGLE_SECRET=
        // NEXTAUTH_URL=https://yourdomain.com
        // GOOGLE_PLACES_API_KEY=
        // NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
        // ANTHROPIC_API_KEY=
      },
    },
  ],
}
