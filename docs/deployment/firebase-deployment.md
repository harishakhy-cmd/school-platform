# Firebase Deployment

## Readiness

**Not implemented.** The repository currently has no Firebase SDK setup,
`firebase.json`, `.firebaserc`, Cloud Functions source, Firestore rules or
indexes, Storage rules, emulator configuration, or Firebase workflow. The
existing Express routes and MySQL models are not a Firebase backend. Do not
deploy the UI alone and describe it as a complete educational platform.

## Required implementation before deployment

- Firebase client initialization with build-time public configuration.
- Firebase Authentication integration and server-side verified identities.
- Cloud Functions or Cloud Run API composition independent from Vercel.
- Firestore repositories, indexes, strict authorization rules, and migrations
  from the existing MySQL data model.
- Cloud Storage upload/download adapters and restrictive rules.
- App Check where supported, server-side authorization, validation, and
  structured error handling.
- Emulator configuration/tests for auth, rules, functions, and storage.
- Durable handling or replacement of Socket.IO and filesystem uploads.
- A production build and separate deployment workflow using protected
  credentials/workload identity.

## Provisioning and billing

When implementation is complete, provision a Firebase project, enable
Authentication, Firestore, Storage, Functions/Cloud Run as selected, and
configure billing/quotas. Project IDs, region, providers, App Check
registration, authorized domains, and billing are not present in this repo.
Keep all Admin SDK credentials server-side; never commit service-account JSON.

## Deployment commands

No Firebase deployment command is provided yet: no Firebase CLI dependency,
configuration, rules, or backend exists in the repository. A command will be
documented here only after its target files and emulator/deployment workflow
are implemented and validated.
