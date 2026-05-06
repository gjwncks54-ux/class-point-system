import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyApfeEJe4uxdxhhMSzMDijwFh80Gqx7v8E",
  authDomain: "class-point-system-f3bec.firebaseapp.com",
  projectId: "class-point-system-f3bec",
  storageBucket: "class-point-system-f3bec.firebasestorage.app",
  messagingSenderId: "672516344748",
  appId: "1:672516344748:web:bfe549870bff3190b4c809",
  measurementId: "G-FZ1Y17XWL5",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const functions = getFunctions(firebaseApp);

if (import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === "true") {
  connectFunctionsEmulator(
    functions,
    import.meta.env.VITE_FUNCTIONS_EMULATOR_HOST || "127.0.0.1",
    Number(import.meta.env.VITE_FUNCTIONS_EMULATOR_PORT || 5001)
  );
}

export { auth, db, firebaseApp, functions };
