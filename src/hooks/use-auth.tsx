import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  PhoneAuthProvider,
  linkWithCredential,
  linkWithPopup,
  signInWithCredential,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { useWishlist } from "@/lib/wishlist-store";
import { logClientError } from "@/lib/sentry";
import { toast } from "sonner";

export interface UserProfile {
  id: string; // matches firebase uid
  name: string;
  email: string;
  phone: string;
  avatar: string;
  provider: string;
  google_id: string;
  phone_verified: boolean;
  email_verified: boolean;
  created_at: string;
}

type AuthContextValue = {
  session: { user: UserProfile } | null;
  user: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  linkPhone: (phoneNumber: string, verificationId: string, code: string) => Promise<void>;
  linkGoogle: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  linkPhone: async () => {},
  linkGoogle: async () => {},
  refreshUserProfile: async () => {},
});

// Deep database merge function in case different auth accounts contain matching emails/phones
async function mergeUserData(oldUid: string, newUid: string) {
  try {
    const oldUserDoc = await getDoc(doc(db, "users", oldUid));
    if (!oldUserDoc.exists()) return;

    const oldData = oldUserDoc.data() as UserProfile;
    const batch = writeBatch(db);

    // Merge profile fields (keeping new UIDs fields as priority but filling missing)
    const newUserDoc = await getDoc(doc(db, "users", newUid));
    const newData = newUserDoc.exists() ? (newUserDoc.data() as UserProfile) : null;

    const mergedData: UserProfile = {
      id: newUid,
      name: newData?.name || oldData.name || "",
      email: newData?.email || oldData.email || "",
      phone: newData?.phone || oldData.phone || "",
      avatar: newData?.avatar || oldData.avatar || "",
      provider: newData?.provider || oldData.provider || "google",
      google_id: newData?.google_id || oldData.google_id || "",
      phone_verified: newData?.phone_verified || oldData.phone_verified || false,
      email_verified: newData?.email_verified || oldData.email_verified || false,
      created_at: newData?.created_at || oldData.created_at || new Date().toISOString(),
    };

    batch.set(doc(db, "users", newUid), mergedData, { merge: true });
    batch.delete(doc(db, "users", oldUid));

    // Migrate related documents referencing the old uid to the new uid
    const collectionsToMigrate = [
      "addresses",
      "wishlist_items",
      "payment_methods",
      "product_reviews",
      "recently_viewed",
      "farmer_profiles",
      "farmer_documents",
      "farmer_products",
    ];
    for (const colName of collectionsToMigrate) {
      const q = query(collection(db, colName), where("user_id", "==", oldUid));
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        batch.update(doc(db, colName, d.id), { user_id: newUid });
      });
    }

    await batch.commit();
    console.log(`[Firebase Merge] Deep-merged database record from ${oldUid} to ${newUid}`);
  } catch (err) {
    console.error("[Firebase Merge] Failed merging profiles:", err);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUserProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(userRef);

      let profileData: UserProfile;

      if (docSnap.exists()) {
        const existingData = docSnap.data() as UserProfile;
        // Merge/update profile on sign-in
        profileData = {
          ...existingData,
          name: existingData.name || firebaseUser.displayName || "",
          email: existingData.email || firebaseUser.email || "",
          phone: existingData.phone || firebaseUser.phoneNumber || "",
          avatar: existingData.avatar || firebaseUser.photoURL || "",
          provider: existingData.provider || firebaseUser.providerData[0]?.providerId || "google",
          google_id:
            existingData.google_id ||
            firebaseUser.providerData.find((p) => p.providerId === "google.com")?.uid ||
            "",
          phone_verified: existingData.phone_verified || !!firebaseUser.phoneNumber,
          email_verified: existingData.email_verified || firebaseUser.emailVerified,
        };
        await updateDoc(userRef, profileData as any);
      } else {
        // Check if there is another document with matching email or phone for automatic merging
        let matchedOldUid = "";

        if (firebaseUser.email) {
          const q = query(collection(db, "users"), where("email", "==", firebaseUser.email));
          const snap = await getDocs(q);
          if (!snap.empty) matchedOldUid = snap.docs[0].id;
        }

        if (!matchedOldUid && firebaseUser.phoneNumber) {
          const q = query(collection(db, "users"), where("phone", "==", firebaseUser.phoneNumber));
          const snap = await getDocs(q);
          if (!snap.empty) matchedOldUid = snap.docs[0].id;
        }

        if (matchedOldUid) {
          // Automatic DB-level account merging
          await mergeUserData(matchedOldUid, firebaseUser.uid);
          const mergedSnap = await getDoc(userRef);
          profileData = mergedSnap.data() as UserProfile;
        } else {
          // Create new user profile document
          profileData = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || "",
            email: firebaseUser.email || "",
            phone: firebaseUser.phoneNumber || "",
            avatar: firebaseUser.photoURL || "",
            provider: firebaseUser.providerData[0]?.providerId || "google",
            google_id:
              firebaseUser.providerData.find((p) => p.providerId === "google.com")?.uid || "",
            phone_verified: !!firebaseUser.phoneNumber,
            email_verified: firebaseUser.emailVerified,
            created_at: firebaseUser.metadata.creationTime || new Date().toISOString(),
          };
          await setDoc(userRef, profileData);
        }
      }

      setUserProfile(profileData);
      void useWishlist.getState().setUser(profileData.id);
    } catch (err: any) {
      console.error("[Firebase Auth] Error syncing user profile:", err);
      if (typeof window !== "undefined") {
        toast.error(`Profile Sync Error: ${err.message || "Permission denied or network error"}`);
      }
      logClientError({
        data: {
          message: err.message || "Failed syncing user profile",
          stack: err.stack || "",
          source: "syncUserProfile",
        },
      }).catch(() => {});
    }
  };

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return () => {};
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        await syncUserProfile(firebaseUser);
      } else {
        setUserProfile(null);
        void useWishlist.getState().setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshUserProfile = async () => {
    if (auth.currentUser) {
      await syncUserProfile(auth.currentUser);
    }
  };

  const linkPhone = async (phoneNumber: string, verificationId: string, code: string) => {
    if (!auth.currentUser) throw new Error("No authenticated user session found.");

    const credential = PhoneAuthProvider.credential(verificationId, code);
    const hasPhoneProvider = auth.currentUser.providerData.some(
      (p: any) => p.providerId === "phone",
    );

    let updatedUser;
    if (hasPhoneProvider) {
      const { updatePhoneNumber } = await import("firebase/auth");
      await updatePhoneNumber(auth.currentUser, credential);
      updatedUser = auth.currentUser;
    } else {
      const result = await linkWithCredential(auth.currentUser, credential);
      updatedUser = result.user;
    }

    await syncUserProfile(updatedUser);
  };

  const linkGoogle = async () => {
    if (!auth.currentUser) throw new Error("No authenticated user session found.");

    const provider = new GoogleAuthProvider();
    const result = await linkWithPopup(auth.currentUser, provider);
    await syncUserProfile(result.user);
  };

  const value: AuthContextValue = {
    session: userProfile ? { user: userProfile } : null,
    user: userProfile,
    loading,
    signOut: async () => {
      await firebaseSignOut(auth);
    },
    linkPhone,
    linkGoogle,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
