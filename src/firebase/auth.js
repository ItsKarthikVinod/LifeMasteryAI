import { auth } from "./firebase";
import { createUserWithEmailAndPassword , GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, getAuth, signInAnonymously} from "firebase/auth";

export const doCreateUserWithEmailAndPassword = async(email,password) =>{
    return createUserWithEmailAndPassword(auth, email,password)
}

export const doSignInWithEmailAndPassword = (email, password)=>{
    return signInWithEmailAndPassword(auth, email, password)
}

export const doSignInWithGoogle = async() =>{
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return result
}

export const doSignInAnonymously = () => {
  const auth = getAuth();
  return signInAnonymously(auth);
};

export const doSignOut = () =>{
    return auth.signOut()
}