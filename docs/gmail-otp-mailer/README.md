# Gmail OTP mailer (free)

SafeShare sends its verification codes with a small **Google Apps Script** that uses a Gmail account.
The backend calls it over HTTPS, so it works on any host, including the ones that block SMTP (Render's free tier).

- Free, no credit card, no domain.
- The mail really comes from Gmail, so it reaches the inbox.
- Limit: about 100 recipients per day for a normal Gmail account, which is plenty for sign-in codes.

## Setup (about 5 minutes)

Use a Gmail account made for the project, not your personal one.

1. Open <https://script.google.com> signed in to that Gmail account, and choose **New project**.
2. Delete the sample code and paste the whole of [`Code.gs`](Code.gs).
3. **Project Settings** (the gear) > **Script properties** > **Add script property**:
   name `MAIL_SECRET`, value a long random text. Generate one with `openssl rand -hex 24`.
   Keep it: the backend needs the same value.
4. **Deploy** > **New deployment** > type **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy** and allow the permissions. Google shows "Google hasn't verified this app": choose
   **Advanced** > **Go to ... (unsafe)**. This is your own script asking to send mail as you.
6. Copy the **Web app URL** (it ends with `/exec`). Opening it in a browser should show
   `{"ok":true,"service":"safeshare-otp-mailer",...}`.

## Connect SafeShare

Put these two values in the backend's environment (`.env` locally, or the variables of your backend host):

```
MAIL_WEBHOOK_URL=https://script.google.com/macros/s/XXXX/exec
MAIL_WEBHOOK_SECRET=<the same text as MAIL_SECRET>
```

Restart the backend. Leave `MAIL_USERNAME`, `MAIL_PASSWORD` and `DEV_LOG_OTP` empty or `false`.

## Good to know

- Anyone who has the web app URL **and** the secret can send mail as that Gmail account, so keep both private.
  Without the secret the script refuses every request. To change the secret, edit the script property.
- If you edit the code later, use **Deploy** > **Manage deployments** > edit > **New version**, otherwise the
  old code keeps running.
- The e-mails show the sender name "SafeShare" and the Gmail address of the account that owns the script.
