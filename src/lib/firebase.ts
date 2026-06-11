import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Load configuration keys dynamically (supporting client Vite & server-side SSR)
const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    (typeof process !== "undefined" ? process.env.FIREBASE_API_KEY : ""),
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    (typeof process !== "undefined" ? process.env.FIREBASE_AUTH_DOMAIN : ""),
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    (typeof process !== "undefined" ? process.env.FIREBASE_PROJECT_ID : ""),
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    (typeof process !== "undefined" ? process.env.FIREBASE_STORAGE_BUCKET : ""),
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    (typeof process !== "undefined" ? process.env.FIREBASE_MESSAGING_SENDER_ID : ""),
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    (typeof process !== "undefined" ? process.env.FIREBASE_APP_ID : ""),
};

// Check if variables are missing and log warning (prevents complete crash while letting user know)
export const isFirebaseConfigured =
  !!firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "" &&
  firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY";

let app: any;
let auth: any;
let db: any;
let storage: any;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (err) {
    console.error("[Firebase Init] Error initializing Firebase SDK:", err);
    setupFallbackProxies();
  }
} else {
  if (typeof window !== "undefined") {
    console.warn(
      "[Firebase Config] Missing Firebase Web App keys in .env. Please connect your Firebase Console credentials.",
    );
  }
  setupFallbackProxies();
}

function setupFallbackProxies() {
  auth = new Proxy(
    {},
    {
      get(target, prop) {
        if (prop === "onAuthStateChanged") {
          return (cb: any) => {
            // Immediately call with null (no user logged in) to allow app to boot
            if (typeof cb === "function") {
              try {
                cb(null);
              } catch (e) {
                console.error(
                  "[Firebase Auth Proxy] Error calling onAuthStateChanged callback:",
                  e,
                );
              }
            }
            return () => {};
          };
        }
        if (prop === "currentUser") {
          return null;
        }
        if (prop === "app" || prop === "config" || prop === "name") {
          return undefined;
        }
        return (...args: any[]) => {
          const errorMsg =
            "Firebase is not configured. Please add your VITE_FIREBASE_* credentials to the .env file.";
          console.warn(
            `[Firebase Auth Proxy] Action '${String(prop)}' invoked but Firebase is not configured.`,
          );
          throw new Error(errorMsg);
        };
      },
    },
  );

  db = new Proxy(
    {},
    {
      get(target, prop) {
        return (...args: any[]) => {
          const errorMsg =
            "Firestore is not configured. Please add your VITE_FIREBASE_* credentials to the .env file.";
          console.warn(
            `[Firestore Proxy] Action '${String(prop)}' invoked but Firestore is not configured.`,
          );
          throw new Error(errorMsg);
        };
      },
    },
  );

  storage = new Proxy(
    {},
    {
      get(target, prop) {
        return (...args: any[]) => {
          const errorMsg =
            "Firebase Storage is not configured. Please add your VITE_FIREBASE_* credentials to the .env file.";
          console.warn(
            `[Firebase Storage Proxy] Action '${String(prop)}' invoked but Firebase Storage is not configured.`,
          );
          throw new Error(errorMsg);
        };
      },
    },
  );
}

export { auth, db, storage };
export default app;
