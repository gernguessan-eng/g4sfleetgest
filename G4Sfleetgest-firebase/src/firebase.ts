import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// ⚠️ Remplacez les valeurs ci-dessous par celles de VOTRE projet Firebase FleetGest
// (Console Firebase → ⚙️ Paramètres du projet → Vos applications → Config SDK).
// Ces informations ne sont pas secrètes : elles identifient votre projet, pas vos données.
const firebaseConfig = {
  apiKey: "AIzaSyA52cG0kBY5GP_uqlzMxWWJy_i89qBfzLo",
  authDomain: "fleetgest-prod.firebaseapp.com",
  projectId: "fleetgest-prod",
  storageBucket: "fleetgest-prod.firebasestorage.app",
  messagingSenderId: "615338695184",
  appId: "1:615338695184:web:3426b733adf1bf41564895",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);

// Contrairement à AtelierGest, FleetGest a un vrai écran de connexion (voir authService.ts /
// Login.tsx) : pas de connexion anonyme technique ici. `authReady` se résout dès qu'un
// utilisateur réellement connecté est détecté — utile pour firestoreSync.ts, qui n'est de
// toute façon monté qu'une fois l'utilisateur authentifié (voir App.tsx).
export const authReady: Promise<void> = new Promise((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      unsubscribe();
      resolve();
    }
  });
});
