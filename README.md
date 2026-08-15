# Chemistry Laboratory Manager

A single-file web app for running a chemistry lab: student records,
experiments, attendance, evaluation marks, and reports — with an administrator
account and teacher accounts underneath it.

It is **one file, `index.html`**, with no build step. You can open it locally,
or publish it with GitHub Pages and use it from a phone or laptop browser.

## Roles

**Administrator** (username `admin`)
- Add, edit, and permanently delete students and experiments
- Add teacher accounts, set their username/password, and assign them classes
  (programme + semester + section)
- Move any student or experiment between the **active** list and the
  **not‑active** list, and back
- Add, rename, or remove experiment **categories** from the Experiments tab
  (a category can't be removed while experiments still use it — reassign
  those experiments first)
- Full access to attendance, evaluation, dashboard, and reports
- Change their own password

**Teacher** (account created by the administrator)
- Sees only the students in their assigned classes
- Add new students to their assigned classes
- Move students and experiments between active / not‑active
- Mark attendance and enter evaluation marks for their students
- Change their own password
- Cannot add other teachers, cannot permanently delete students/experiments,
  cannot reassign their own classes

The admin account (`admin`) has **two passwords that both work**:

- **Fixed password:** `skjain.phy@gmail.com` — a permanent password for the
  **HoD**. It always logs in as admin, no matter what the password below is
  currently set to, and it never changes or expires. This is what gives you
  a way into any of the six labs (Physics, Chemistry, Biology, Psychology,
Language, Mathematics)
  at any time — including if a faculty-in-charge is unavailable, leaves
  suddenly, or the app needs to be handed over next semester.
- **Changeable password:** starts as `sanjeev.j@invertis.org`. This is the
  one meant for day-to-day use by whoever you've appointed as
  faculty-in-charge for that lab.

To hand the lab to a faculty-in-charge, sign in as `admin` (using either
password above), open **Change password**, and set it to whatever you want
their working password to be — you can use the fixed password as the
"current password" to authorize this, so you never need to know what the
changeable password currently is. When that person leaves or the semester
turns over, sign back in with the fixed password and set a new changeable
password for the next person. The fixed password itself is baked into the
app's code and is unaffected by any of this — it always keeps working.

(The `sanjeev.j@invertis.org` recovery address is also on file for the
"Forgot password" email-OTP flow, as a second way to reset the changeable
password if needed.)

## How data is stored

By default, all data (students, experiments, attendance, marks, teacher
accounts) is stored in the browser's `localStorage`, scoped to whichever
device/browser you're using it on. Nothing about this is ever written back
into the GitHub repository — only the app's code lives there.

**What this means in practice, by default:**
- Data you enter on your laptop will not automatically appear on your phone,
  and vice versa — each device keeps its own copy.
- Clearing your browser's site data/history for this page will erase it.
- Anyone with access to the same browser profile could open developer tools
  and read the stored data, including password hashes.

If you'd like every device to see the same, live, shared data instead — so
the admin and every teacher are all looking at the same student list from
wherever they log in — see the next section. It stores the same data in a
Google Sheet in your Drive rather than in each separate browser.

Passwords are never stored in plain text — they're hashed with SHA-256 before
being saved, whether stored locally or in the Sheet.

## Sync data through Google Drive (optional, recommended for multiple teachers)

This uses a small, free script attached to a Google Sheet in your own Drive
as the shared "database." No paid service, no server to maintain — Google
runs it for you. Setup takes about 10 minutes, once.

1. **Open your Google Sheet.**
   Yours: https://docs.google.com/spreadsheets/d/1weeHNSK_6O2vt6vvMnST_jqGq8cJC7aOk7zsOYIVlFM/edit?usp=sharing
   (This has already been created for you — the app will create its own tabs
   inside it automatically the first time it syncs. Keep it separate from
   the other labs' sheets; each lab needs its own.)

2. **Attach the script.**
   In the Sheet, go to **Extensions → Apps Script**. This opens a script
   editor tied to that specific sheet. Delete any placeholder code in
   `Code.gs`, then paste in the entire contents of **`google-apps-script.gs`**
   from this repository.

3. **Set a shared secret (recommended).**
   In the script, near the top, change:
   ```js
   var SHARED_TOKEN = "choose-a-long-random-shared-secret";
   ```
   to something long and random of your own. Anyone with your deployed URL
   *and* this exact token can read/write the data, so keep it private, the
   same way you'd treat a password.

4. **Deploy it as a Web App.**
   - Click **Deploy → New deployment**.
   - Click the gear icon next to "Select type" and choose **Web app**.
   - **Execute as:** Me (your account).
   - **Who has access:** Anyone. *(This is what lets teachers use the app
     without needing their own Google account or Drive permissions — the
     script always runs as you, the sheet owner. Access is instead
     controlled by your secret token, and by the token being embedded only
     in the app you deploy.)*
   - Click **Deploy**. The first time, Google will ask you to authorize the
     script — that's you granting your own script permission to edit your
     own Sheet; click through the consent screen (choose "Advanced" → "Go to
     [project name] (unsafe)" if Google shows an unverified-app warning —
     this is expected for a script you wrote yourself).
   - Copy the **Web app URL** you're given — it looks like
     `https://script.google.com/macros/s/XXXXXXXX/exec`.

5. **Point the app at it.**
   In `index.html`, find the `SHEET_SYNC_CONFIG` block near the top of the
   `<script type="text/babel">` section:
   ```js
   const SHEET_SYNC_CONFIG = {
     enabled: false,
     webAppUrl: "PASTE_YOUR_DEPLOYED_WEB_APP_URL_HERE",
     token: "choose-a-long-random-shared-secret",
   };
   ```
   Set `enabled: true`, paste your Web app URL into `webAppUrl`, and set
   `token` to the exact same string you used in step 3. Save the file,
   commit, and push (or re-upload `index.html` if you're not using git
   locally).

6. **Verify.**
   Reload the app and sign in. In the sidebar (desktop) you'll see a small
   status line: "Synced to Google Sheet" once it's working. If it instead
   says "Offline — saved on this device only," double-check the URL, token,
   and that the deployment's access is set to "Anyone."

**A few things worth knowing:**
- Every time you edit `google-apps-script.gs` afterward, you need to
  **Deploy → Manage deployments → edit (pencil) → New version** for the
  change to actually take effect — just saving the script isn't enough.
- Don't hand-edit the data inside the `app_data` / `app_auth` sheet tabs the
  script creates — it's a single JSON blob in cell A1, not meant to be
  readable/editable as a spreadsheet. Use the app itself for all changes.
- Like the local-storage version, this uses "last write wins": if two people
  save at almost the exact same instant, the second save overwrites the
  first. To make this easy to avoid in practice, the app shows a brief
  "Saved" confirmation (bottom-right corner) every time any change — adding
  a student, moving someone active/inactive, entering marks, and so on —
  finishes writing to the Sheet. As long as each person waits for that
  confirmation before handing off to the next person or closing the tab,
  two edits won't collide. If a save can't reach the Sheet, the message
  instead says so and reminds you the change is saved on that device only
  for now.
- If the Sheet is ever unreachable (no internet, Google having an outage,
  wrong URL), the app automatically falls back to saving on that device
  locally so no work is lost, and will show a message saying so.

## Changing a password

From the sidebar (or the key icon on mobile), choose **Password**. You can either:
1. Enter your current password and set a new one, or
2. Verify by email instead — a 6-digit code is generated and (if configured,
   see below) emailed to you. The administrator's account can be verified via
   either `skjain.phy@gmail.com` or `sanjeev.j@invertis.org`; a teacher's
   account is verified via the email their administrator put on file when
   creating the account.

### Enable real password-reset emails (optional, recommended)

Out of the box, since this is a static site with no backend, a "forgot
password" code is simply shown on screen instead of emailed — good enough for
testing, but not for real password recovery. To send it by real email:

1. Create a free account at [emailjs.com](https://www.emailjs.com).
2. Add an **Email Service** (e.g. connect it to a Gmail account).
3. Create an **Email Template** with variables `{{to_email}}`, `{{otp_code}}`,
   `{{purpose}}`, `{{lab_name}}` — e.g. a body like:
   > Your {{lab_name}} {{purpose}} code is **{{otp_code}}**.
4. In `index.html`, find the `EMAILJS_CONFIG` block near the top of the
   `<script type="text/babel">` section and fill in your Service ID,
   Template ID, and Public Key, then set `enabled: true`.
5. Commit and push — that's it, no backend to run.

## Publishing to GitHub Pages

1. Create a new GitHub repository (public or private) and upload `index.html`
   (and this `README.md`) to it — either via the GitHub web UI's "Add file →
   Upload files", or:
   ```bash
   git init
   git add index.html README.md
   git commit -m "Chemistry lab manager"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch",
   branch `main`, folder `/ (root)`, then **Save**.
4. After a minute, GitHub will show a URL like
   `https://<your-username>.github.io/<your-repo>/` — that's your live app,
   usable on desktop and mobile browsers alike.

No build tools, npm install, or server are required — GitHub Pages just
serves the static file.

## Local use without GitHub

You can also just double-click `index.html` to open it in a browser. A couple
of caveats in that mode: some browsers restrict `localStorage`/`crypto`
slightly differently for files opened directly (`file://`) versus a real
`https://` page, so for the most reliable experience, serve it over Pages (or
any static host / `python3 -m http.server` locally) rather than double-clicking
the file.

## Sample data

On first run the app loads 50 sample students and 20 standard chemistry
experiments (with six weeks of sample attendance/marks) so you can see how
everything works. From the Dashboard, the administrator can click "Reload
sample data" at any time to reset back to this starting point — this **erases
all data**, so use it only when you mean to start over.
