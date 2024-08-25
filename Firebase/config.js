import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";


const firebaseConfig = {
    //Paste Your firebase config here
   
    apiKey: "AIzaSyBYFlikRYnPI8p4Zx1iKOiKjbDoYvC5yW0",
    authDomain: "engineeringacademy-6e30f.firebaseapp.com",
    projectId: "engineeringacademy-6e30f",
    storageBucket: "engineeringacademy-6e30f.appspot.com",
    messagingSenderId: "884466530367",
    appId: "1:884466530367:web:3b9752e4b245cd116e608a"
    
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export { firebase }



