import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  setDoc,
  getDoc,
  serverTimestamp,
  doc,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {

  // apiKey: "AIzaSyAfMVAj7G8gvM88_jdbMhvcEGxWuPBWk3Y",
  // authDomain: "reviewuplift-425c4.firebaseapp.com",
  // projectId: "reviewuplift-425c4",
  // storageBucket: "reviewuplift-425c4.firebasestorage.app",
  // messagingSenderId: "304773401426",
  // appId: "1:304773401426:web:7479742034cb725892088b",
  // measurementId: "G-B1FYXSQKC4"
 

  // akil
  apiKey: "AIzaSyCKQ8mKGOAZxUHyQjqu6V9vWVd6fPpxh1M",
  authDomain: "reviewuplift-testing.firebaseapp.com",
  projectId: "reviewuplift-testing",
  storageBucket: "reviewuplift-testing.firebasestorage.app",
  messagingSenderId: "256258929098",
  appId: "1:256258929098:web:f5f2b708d7b4bad6f79f33",
  measurementId: "G-NFQKY9YK7V"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const q = query(collection(db, "users"), where("email", "==", user.email));
  const existingUsers = await getDocs(q);

  if (!existingUsers.empty && existingUsers.docs[0].id !== user.uid) {
    throw new Error("Email already exists. Please log in using email and password.");
  }
};