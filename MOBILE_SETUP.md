# ExpenseIQ Mobile Setup

This project can be wrapped as an Android app with Capacitor without rewriting the current HTML, CSS, and JavaScript.

## 1. Install dependencies

Run these commands in the project root:

```powershell
npm.cmd install
npx.cmd cap add android
```

## 2. Prepare the mobile bundle

This project keeps the source files in the repo root, so Capacitor uses a generated `mobile-web/` folder as its `webDir`.

```powershell
npm.cmd run mobile:prepare
```

## 3. Sync and open Android Studio

```powershell
npm.cmd run mobile:sync
npm.cmd run mobile:android
```

This will:

- copy the current web app into `mobile-web/`
- sync it into the native Android project
- open the `android/` folder in Android Studio

## 4. Run on a device or emulator

In Android Studio:

1. Wait for Gradle sync to finish.
2. Start an emulator or connect your phone with USB debugging enabled.
3. Press Run.

## Notes

- Email/password auth should work as-is because the app already talks to Supabase from the client.
- Google OAuth will likely need an extra native deep-link flow for a polished mobile sign-in experience.
- If you change any HTML, CSS, or JS files, run `npm run mobile:sync` again before rebuilding the Android app.
- The Supabase redirect allow-list may need to include the app hostname used in [capacitor.config.json](/c:/Users/Dinesh%20Karthik/Documents/Expenditure_Tracker/capacitor.config.json).
