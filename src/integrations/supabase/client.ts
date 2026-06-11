import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  writeBatch,
  documentId,
} from "firebase/firestore";
import { db, auth, isFirebaseConfigured } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { fileToBase64 } from "@/lib/file-to-base64";

// Chainable adapter mapping Supabase REST syntax to native Firebase Web SDK queries
class FirestoreQueryBuilder {
  private table: string;
  private action: "select" | "insert" | "update" | "delete" = "select";
  private payload: any = null;
  private filters: { col: string; val: any; op?: string }[] = [];
  private sorts: { col: string; asc: boolean }[] = [];
  private limitCount: number | null = null;
  private isSingle = false;

  constructor(table: string) {
    // Map Profiles table to users collection in Firebase
    if (table === "profiles") {
      this.table = "users";
    } else {
      this.table = table;
    }
  }

  private mapFromFirestore(item: any) {
    if (!item) return item;
    if (this.table === "users") {
      const mapped = { ...item };
      if ("name" in item) {
        mapped.full_name = item.name;
      }
      if ("avatar" in item) {
        mapped.avatar_url = item.avatar;
      }
      return mapped;
    }
    return item;
  }

  private mapToFirestore(item: any) {
    if (!item) return item;
    if (this.table === "users") {
      const mapped = { ...item };
      if ("full_name" in item) {
        mapped.name = item.full_name;
        delete mapped.full_name;
      }
      if ("avatar_url" in item) {
        mapped.avatar = item.avatar_url;
        delete mapped.avatar_url;
      }
      return mapped;
    }
    return item;
  }

  select(columns?: string, options?: any) {
    if (this.action !== "insert" && this.action !== "update" && this.action !== "delete") {
      this.action = "select";
    }
    return this;
  }

  insert(payload: any) {
    this.action = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: any) {
    this.action = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  upsert(payload: any, options?: any) {
    this.action = "insert";
    this.payload = payload;
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ col: column, val: values, op: "in" });
    return this;
  }

  eq(column: string, value: any) {
    // Map column naming schema if needed
    const colName = column === "user_id" && this.table === "users" ? "id" : column;
    this.filters.push({ col: colName, val: value });
    return this;
  }

  neq(column: string, value: any) {
    const colName = column === "user_id" && this.table === "users" ? "id" : column;
    this.filters.push({ col: colName, val: value, op: "!=" });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.sorts.push({ col: column, asc: options?.ascending !== false });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  // A thenable handler allows the builder to be used directly with async/await
  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      if (!isFirebaseConfigured) {
        let fallbackData: any = [];
        if (this.table === "users" || this.table === "profiles") {
          fallbackData = this.isSingle ? null : [];
        } else if (this.isSingle) {
          fallbackData = null;
        }
        const result = {
          data: fallbackData,
          error: null,
          count: Array.isArray(fallbackData) ? fallbackData.length : 0,
        };
        if (onfulfilled) return onfulfilled(result);
        return result;
      }

      const result: any = { data: null, error: null, count: 0 };

      if (this.action === "select") {
        // If there is an 'in' filter with an empty array, short-circuit and return empty data
        const emptyInFilter = this.filters.find((f) => f.op === "in" && Array.isArray(f.val) && f.val.length === 0);
        if (emptyInFilter) {
          result.data = this.isSingle ? null : [];
          result.count = 0;
          if (onfulfilled) return onfulfilled(result);
          return result;
        }

        const idFilter = this.filters.find((f) => f.col === "id");

        // Single document retrieval by key
        if (idFilter && (this.isSingle || this.table === "users")) {
          const docSnap = await getDoc(doc(db, this.table, idFilter.val));
          if (docSnap.exists()) {
            const docData = this.mapFromFirestore({ id: docSnap.id, ...docSnap.data() });
            result.data = this.isSingle ? docData : [docData];
            result.count = 1;
          } else {
            result.data = this.isSingle ? null : [];
            result.count = 0;
          }
        } else {
          // Query collection
          const colRef = collection(db, this.table);
          let list: any[] = [];

          try {
            // Try full query with filters + sorting (may fail if composite index is missing)
            let q: any = colRef;
            this.filters.forEach((f) => {
              const op = (f as any).op || "==";
              const colName = f.col === "id" ? documentId() : f.col;
              q = query(q, where(colName, op, f.val));
            });
            this.sorts.forEach((s) => {
              q = query(q, orderBy(s.col, s.asc ? "asc" : "desc"));
            });
            if (this.limitCount !== null) {
              q = query(q, firestoreLimit(this.limitCount));
            }
            const snap = await getDocs(q);
            list = snap.docs.map((d) =>
              this.mapFromFirestore({ id: d.id, ...(d.data() as any) }),
            );
          } catch (indexErr: any) {
            // Firestore composite index error — fall back to filter-only query + client-side sort
            console.warn("[Firestore] Composite index missing, falling back to client-side sort:", indexErr?.message);
            let q: any = colRef;
            this.filters.forEach((f) => {
              const op = (f as any).op || "==";
              const colName = f.col === "id" ? documentId() : f.col;
              q = query(q, where(colName, op, f.val));
            });
            if (this.limitCount !== null) {
              q = query(q, firestoreLimit(this.limitCount));
            }
            const snap = await getDocs(q);
            list = snap.docs.map((d) =>
              this.mapFromFirestore({ id: d.id, ...(d.data() as any) }),
            );
            // Apply sorting client-side
            if (this.sorts.length > 0) {
              list.sort((a, b) => {
                for (const s of this.sorts) {
                  const aVal = a[s.col] ?? "";
                  const bVal = b[s.col] ?? "";
                  if (aVal < bVal) return s.asc ? -1 : 1;
                  if (aVal > bVal) return s.asc ? 1 : -1;
                }
                return 0;
              });
            }
          }

          if (this.isSingle) {
            result.data = list.length > 0 ? list[0] : null;
          } else {
            result.data = list;
          }
          result.count = list.length;
        }
      } else if (this.action === "insert") {
        const mappedPayload = this.mapToFirestore(this.payload);
        const payloads = Array.isArray(mappedPayload) ? mappedPayload : [mappedPayload];
        const inserted: any[] = [];

        for (const item of payloads) {
          // Auto-add timestamps if not present
          const now = new Date().toISOString();
          if (!item.created_at) item.created_at = now;
          if (!item.updated_at) item.updated_at = now;

          // Deterministic ID generation for tables without explicit key id (like wishlist_items, recently_viewed)
          let targetId = item.id || null;
          if (!targetId) {
            if (item.user_id && item.product_slug) {
              targetId = `${item.user_id}_${item.product_slug}`;
            } else if (item.user_id && item.slug) {
              targetId = `${item.user_id}_${item.slug}`;
            } else if (item.user_id && this.table === "users") {
              targetId = item.user_id;
            }
          }

          if (targetId) {
            const docRef = doc(db, this.table, targetId);
            await setDoc(docRef, item, { merge: true });
            inserted.push(this.mapFromFirestore({ id: targetId, ...item }));
          } else {
            const colRef = collection(db, this.table);
            const docRef = await addDoc(colRef, item);
            inserted.push(this.mapFromFirestore({ id: docRef.id, ...item }));
          }
        }

        result.data = Array.isArray(mappedPayload) ? inserted : inserted[0];
      } else if (this.action === "update") {
        const idFilter = this.filters.find((f) => f.col === "id");
        const mappedPayload = this.mapToFirestore(this.payload);

        if (idFilter) {
          const docRef = doc(db, this.table, idFilter.val);
          await updateDoc(docRef, mappedPayload);
          result.data = this.mapFromFirestore({ id: idFilter.val, ...mappedPayload });
        } else {
          // Query update
          const colRef = collection(db, this.table);
          let q: any = colRef;
          this.filters.forEach((f) => {
            const op = (f as any).op || "==";
            const colName = f.col === "id" ? documentId() : f.col;
            q = query(q, where(colName, op, f.val));
          });
          const snap = await getDocs(q);
          const batch = writeBatch(db);
          snap.docs.forEach((d) => {
            batch.update(doc(db, this.table, d.id), mappedPayload);
          });
          await batch.commit();
          result.data = this.mapFromFirestore(mappedPayload);
        }
      } else if (this.action === "delete") {
        const idFilter = this.filters.find((f) => f.col === "id");

        if (idFilter) {
          const docRef = doc(db, this.table, idFilter.val);
          await deleteDoc(docRef);
        } else {
          // Query delete
          const colRef = collection(db, this.table);
          let q: any = colRef;
          this.filters.forEach((f) => {
            const op = (f as any).op || "==";
            const colName = f.col === "id" ? documentId() : f.col;
            q = query(q, where(colName, op, f.val));
          });
          const snap = await getDocs(q);
          const batch = writeBatch(db);
          snap.docs.forEach((d) => {
            batch.delete(doc(db, this.table, d.id));
          });
          await batch.commit();
        }
      }

      if (onfulfilled) return onfulfilled(result);
      return result;
    } catch (err: any) {
      console.error(`[Firestore Compatibility] Error running query on ${this.table}:`, err);
      const result = { data: null, error: { message: err.message || "Query failed" } };
      if (onrejected) return onrejected(err);
      return result;
    }
  }
}

class FirebaseStorageBuilder {
  private bucket: string;

  constructor(bucket: string) {
    this.bucket = bucket;
  }

  async upload(path: string, file: File, options?: any) {
    if (!isFirebaseConfigured) throw new Error("Firebase not configured");
    try {
      // Convert file to Base64 data URL and store in Firestore
      const base64Data = await fileToBase64(file);
      const docId = `${this.bucket}/${path}`.replace(/\//g, "__");
      const docRef = doc(db, "file_uploads", docId);
      await setDoc(docRef, {
        bucket: this.bucket,
        path: path,
        data: base64Data,
        contentType: file.type,
        size: file.size,
        name: file.name,
        created_at: new Date().toISOString(),
      });
      return { data: { path: path }, error: null };
    } catch (err: any) {
      console.error("[Storage Upload Error]:", err);
      return { data: null, error: { message: err?.message || "Upload failed" } };
    }
  }

  async remove(paths: string[]) {
    if (!isFirebaseConfigured) return { data: null, error: null };
    try {
      const batch = writeBatch(db);
      for (const p of paths) {
        const docId = `${this.bucket}/${p}`.replace(/\//g, "__");
        batch.delete(doc(db, "file_uploads", docId));
      }
      await batch.commit();
      return { data: paths, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || "Remove failed" } };
    }
  }

  async createSignedUrl(path: string, expiry: number) {
    if (!isFirebaseConfigured) throw new Error("Firebase not configured");
    try {
      const docId = `${this.bucket}/${path}`.replace(/\//g, "__");
      const docRef = doc(db, "file_uploads", docId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        return { data: null, error: { message: "File not found" } };
      }
      const fileData = docSnap.data();
      // Return the Base64 data URL directly — it works as a valid image/file src
      return { data: { signedUrl: fileData.data }, error: null };
    } catch (err: any) {
      console.error("[Storage URL Error]:", err);
      return { data: null, error: { message: err?.message || "Could not get URL" } };
    }
  }
}

// Export a proxy object mimicking the Supabase Client
export const supabase = {
  from: (table: string) => {
    return new FirestoreQueryBuilder(table);
  },
  storage: {
    from: (bucket: string) => {
      return new FirebaseStorageBuilder(bucket);
    },
  },
  rpc: async (fnName: string, args?: any) => {
    if (!isFirebaseConfigured) {
      return { data: null, error: { message: "Firebase is not configured." } };
    }

    try {
      if (fnName === "claim_first_admin") {
        if (!auth.currentUser) throw new Error("Not authenticated");

        // Check if any admin exists in user_roles
        const q = query(collection(db, "user_roles"), where("role", "==", "admin"));
        const snap = await getDocs(q);

        if (snap.empty) {
          // No admin exists, claim it!
          const targetId = `admin_${auth.currentUser.uid}`;
          await setDoc(doc(db, "user_roles", targetId), {
            id: targetId,
            user_id: auth.currentUser.uid,
            role: "admin",
            created_at: new Date().toISOString(),
          });
          return { data: true, error: null };
        } else {
          // Admin already exists
          return { data: false, error: null };
        }
      }

      if (fnName === "list_admins") {
        const q = query(collection(db, "user_roles"), where("role", "==", "admin"));
        const snap = await getDocs(q);
        const uids = snap.docs.map((d) => d.data().user_id).filter(Boolean);

        if (uids.length === 0) {
          return { data: [], error: null };
        }

        const userDocs = await Promise.all(uids.map((uid) => getDoc(doc(db, "users", uid))));
        const list = userDocs.filter((d) => d.exists()).map((d) => ({ id: d.id, ...d.data() }));

        return { data: list, error: null };
      }

      if (fnName === "promote_user_to_admin") {
        const { target_email } = args || {};
        if (!target_email) throw new Error("target_email is required");

        const q = query(collection(db, "users"), where("email", "==", target_email));
        const snap = await getDocs(q);
        if (snap.empty) {
          return { data: null, error: { message: `User with email ${target_email} not found` } };
        }

        const userDoc = snap.docs[0];
        const targetId = `admin_${userDoc.id}`;
        await setDoc(doc(db, "user_roles", targetId), {
          id: targetId,
          user_id: userDoc.id,
          role: "admin",
          created_at: new Date().toISOString(),
        });
        return { data: true, error: null };
      }

      if (fnName === "revoke_admin") {
        const { target_user_id } = args || {};
        if (!target_user_id) throw new Error("target_user_id is required");

        const q = query(
          collection(db, "user_roles"),
          where("user_id", "==", target_user_id),
          where("role", "==", "admin"),
        );
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.docs.forEach((d) => {
          batch.delete(doc(db, "user_roles", d.id));
        });
        await batch.commit();
        return { data: true, error: null };
      }

      throw new Error(`RPC function '${fnName}' not implemented in compatibility layer.`);
    } catch (err: any) {
      console.error(`[Firebase RPC compatibility] Error running RPC '${fnName}':`, err);
      return { data: null, error: { message: err.message || "RPC failed" } };
    }
  },
  auth: {
    getSession: async () => {
      if (!isFirebaseConfigured || !auth?.currentUser) {
        return { data: { session: null }, error: null };
      }
      try {
        const token = await auth.currentUser.getIdToken();
        return {
          data: {
            session: {
              access_token: token,
              user: {
                id: auth.currentUser.uid,
                email: auth.currentUser.email,
                phone: auth.currentUser.phoneNumber,
                user_metadata: {
                  name: auth.currentUser.displayName,
                  avatar_url: auth.currentUser.photoURL,
                },
              },
              expires_in: 3600,
              token_type: "bearer",
            },
          },
          error: null,
        };
      } catch (err: any) {
        return { data: { session: null }, error: { message: err.message } };
      }
    },
    getUser: async () => {
      if (!isFirebaseConfigured || !auth?.currentUser) {
        return { data: { user: null }, error: null };
      }
      return {
        data: {
          user: {
            id: auth.currentUser.uid,
            email: auth.currentUser.email,
            phone: auth.currentUser.phoneNumber,
            user_metadata: {
              name: auth.currentUser.displayName,
              avatar_url: auth.currentUser.photoURL,
            },
          },
        },
        error: null,
      };
    },
    setSession: async (tokens: any) => {
      return { data: { session: null }, error: null };
    },
    onAuthStateChange: (callback: any) => {
      if (!isFirebaseConfigured || !auth) {
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
      try {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
          if (firebaseUser) {
            const token = await firebaseUser.getIdToken().catch(() => null);
            callback("SIGNED_IN", {
              access_token: token,
              user: {
                id: firebaseUser.uid,
                email: firebaseUser.email,
                phone: firebaseUser.phoneNumber,
                user_metadata: {
                  name: firebaseUser.displayName,
                  avatar_url: firebaseUser.photoURL,
                },
              },
              expires_in: 3600,
              token_type: "bearer",
            });
          } else {
            callback("SIGNED_OUT", null);
          }
        });
        return { data: { subscription: { unsubscribe } } };
      } catch (err) {
        console.error("[Supabase Proxy onAuthStateChange] Error:", err);
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    },
    signUp: async ({
      email,
      password,
      options,
    }: {
      email: string;
      password: string;
      options?: any;
    }) => {
      if (!isFirebaseConfigured) {
        return { data: { user: null }, error: { message: "Firebase is not configured." } };
      }
      const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (options?.data?.name) {
          await updateProfile(credential.user, { displayName: options.data.name });
        }
        return { data: { user: credential.user }, error: null };
      } catch (err: any) {
        return { data: { user: null }, error: { message: err.message } };
      }
    },
    signOut: async () => {
      if (!isFirebaseConfigured) {
        return { error: null };
      }
      const { signOut: fSignOut } = await import("firebase/auth");
      await fSignOut(auth);
      return { error: null };
    },
    updateUser: async (attributes: any) => {
      if (!isFirebaseConfigured || !auth?.currentUser) {
        return { data: { user: null }, error: { message: "No active session." } };
      }
      const { updatePassword, updateProfile } = await import("firebase/auth");
      try {
        if (attributes.password) {
          await updatePassword(auth.currentUser, attributes.password);
        }
        if (attributes.data?.name || attributes.data?.avatar) {
          await updateProfile(auth.currentUser, {
            displayName: attributes.data?.name ?? auth.currentUser.displayName,
            photoURL: attributes.data?.avatar ?? auth.currentUser.photoURL,
          });
        }
        return { data: { user: auth.currentUser }, error: null };
      } catch (err: any) {
        return { data: { user: null }, error: { message: err.message } };
      }
    },
    resetPasswordForEmail: async (email: string, options?: any) => {
      if (!isFirebaseConfigured) {
        return { data: null, error: { message: "Firebase is not configured." } };
      }
      const { sendPasswordResetEmail } = await import("firebase/auth");
      try {
        await sendPasswordResetEmail(auth, email);
        return { data: null, error: null };
      } catch (err: any) {
        return { data: null, error: { message: err.message } };
      }
    },
  },
} as any;
