# Auto-print shipping labels (secondary Mac)

Unattended 4×6 thermal label printing using a secondary Mac as a print server (broken screen is fine).

**Status:** Print queue API + Mac agent script are in the repo. Auto-buy-on-payment is still manual (buy the label in Admin; the Mac prints it).

---

## How it works

1. You buy a Shippo label in Admin → Orders (as today).
2. The order enters the **print queue** (`labelUrl` set, `labelPrintedAt` null).
3. The secondary Mac runs `scripts/print-agent/print-agent.sh`, which every minute:
   - Asks `GET /api/print-agent/queue` for unprinted labels
   - Downloads the label PDF (or ZPL)
   - Prints via CUPS (`lp`)
   - Marks printed with `POST /api/print-agent/queue/:orderId/printed`

2027 pre-orders are **excluded** from the queue until you choose to fulfill them.

---

## Part A — Website / Vercel (once)

1. Generate a long random secret:

   ```bash
   openssl rand -hex 32
   ```

2. In Vercel → Project → Settings → Environment Variables, add:

   | Name | Value |
   |------|--------|
   | `PRINT_AGENT_SECRET` | the secret from step 1 |

3. Redeploy so production picks it up.

4. Push the `labelPrintedAt` column to production DB (from your laptop, with prod `DATABASE_URL`):

   ```bash
   npm run db:push
   ```

   Or run Prisma against prod however you usually migrate.

---

## Part B — Secondary Mac hardware

| Item | Role |
|------|------|
| Secondary Mac | Always-on print server |
| 4×6 thermal printer | Labels |
| Power adapter | Required for closed-lid (“clamshell”) use |

### Clamshell

- Lid can stay closed
- Must stay **plugged into power**
- Broken screen is fine
- Use an external monitor + keyboard **once**, or Screen Sharing / SSH from your main Mac

### Keep awake

**System Settings → Battery / Energy / Lock Screen** (wording varies):

- When plugged in: **prevent computer sleep** (Never)
- Display sleep is fine

### Printer

1. Connect the printer (USB preferred for reliability).
2. Install the vendor driver if needed (Rollo / Zebra / Munbyn).
3. Confirm CUPS sees it:

   ```bash
   lpstat -p -d
   ```

4. Print a test page from System Settings → Printers, or:

   ```bash
   echo "Bean Book print test" | lp -d YOUR_PRINTER_NAME
   ```

---

## Part C — Install the print agent

On the secondary Mac:

```bash
mkdir -p ~/beanbook-print-agent
# Copy from this repo (or clone):
#   scripts/print-agent/print-agent.sh
#   scripts/print-agent/com.beanbook.print-agent.plist.example
#   scripts/print-agent/.env.example
chmod +x ~/beanbook-print-agent/print-agent.sh
cp ~/beanbook-print-agent/.env.example ~/beanbook-print-agent/.env
```

Edit `~/beanbook-print-agent/.env`:

```bash
PRINT_AGENT_SITE_URL=https://thebeanbook.com
PRINT_AGENT_SECRET=same-secret-as-vercel
PRINT_QUEUE_NAME=Exact_Name_From_lpstat
PRINT_AGENT_DRY_RUN=1
```

### Dry-run smoke test

```bash
cd ~/beanbook-print-agent
./print-agent.sh
```

You should see queue polls in the log. With `DRY_RUN=1` it downloads but does not print.

Buy a test label in Admin, wait up to one minute, confirm a file appears under `/tmp/beanbook-labels/`.

Then set `PRINT_AGENT_DRY_RUN=0` and restart the agent for a real print.

### Run at login (launchd)

1. Copy the plist example and replace `YOUR_USERNAME`:

   ```bash
   cp com.beanbook.print-agent.plist.example ~/Library/LaunchAgents/com.beanbook.print-agent.plist
   # edit paths in the plist
   launchctl load ~/Library/LaunchAgents/com.beanbook.print-agent.plist
   ```

2. Logs:

   - Agent: `/tmp/beanbook-print-agent.log`
   - launchd: `/tmp/beanbook-print-agent.stdout.log` / `.stderr.log`

3. Unload later:

   ```bash
   launchctl unload ~/Library/LaunchAgents/com.beanbook.print-agent.plist
   ```

---

## Safer rollout

1. Mac awake + printer OK — manual CUPS test page  
2. Agent with `PRINT_AGENT_DRY_RUN=1` — downloads only  
3. Real print for one test order  
4. Leave agent running overnight  
5. (Later) auto-buy labels on payment — not built yet  

---

## API reference

Auth: `Authorization: Bearer <PRINT_AGENT_SECRET>`

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/print-agent/queue?limit=20` | Unprinted labels |
| `POST` | `/api/print-agent/queue/:orderId/printed` | Mark printed |

---

## Still optional / later

- Auto-buy Shippo label when an order becomes paid
- Prefer `SHIPPO_LABEL_FILE_TYPE=ZPLII` for raw thermal (set in Vercel if your printer prefers ZPL)
- Admin UI badge “Printed”
