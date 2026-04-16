import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAB_93Z87elfFv1L3Ufoeqzcfv0E6xNgXE",
  authDomain: "timesheet-app-b5e3a.firebaseapp.com",
  databaseURL: "https://timesheet-app-b5e3a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "timesheet-app-b5e3a",
  storageBucket: "timesheet-app-b5e3a.firebasestorage.app",
  messagingSenderId: "651867935633",
  appId: "1:651867935633:web:2fb05f9bfee4e8e7e4c030"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);