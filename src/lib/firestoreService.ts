import { 
  db, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  writeBatch
} from "./firebase";
import { 
  Pelanggan, 
  TanggalPembayaran, 
  BiayaTarif, 
  Transaksi,
  Petugas,
  INITIAL_PELANGGAN,
  INITIAL_TANGGAL_PEMBAYARAN,
  INITIAL_BIAYA_TARIF,
  INITIAL_TRANSAKSI,
  INITIAL_PETUGAS
} from "../types";

// Setup collections refs
const pelangganCol = collection(db, "pelanggan");
const tanggalCol = collection(db, "tanggal_pembayaran");
const biayaCol = collection(db, "biaya_tarif");
const transaksiCol = collection(db, "transaksi");
const petugasCol = collection(db, "petugas");

// Helper to recursively remove undefined fields so Firestore doesn't throw errors
function removeUndefinedFields<T extends object>(obj: T): T {
  const result = { ...obj } as any;
  Object.keys(result).forEach((key) => {
    if (result[key] === undefined) {
      delete result[key];
    } else if (result[key] !== null && typeof result[key] === "object" && !Array.isArray(result[key])) {
      result[key] = removeUndefinedFields(result[key]);
    }
  });
  return result;
}

// Seeding function to initialize Firestore if it has absolutely no data
export const seedInitialDataIfEmpty = async () => {
  try {
    const pSnap = await getDocs(pelangganCol);
    if (pSnap.empty) {
      console.log("Seeding initial data into Firestore...");
      
      const batch = writeBatch(db);
      
      // Seed pelanggan
      INITIAL_PELANGGAN.forEach((p) => {
        const d = doc(db, "pelanggan", p.id);
        batch.set(d, removeUndefinedFields(p));
      });

      // Seed tanggal
      INITIAL_TANGGAL_PEMBAYARAN.forEach((t) => {
        const d = doc(db, "tanggal_pembayaran", t.id);
        batch.set(d, removeUndefinedFields(t));
      });

      // Seed biaya
      INITIAL_BIAYA_TARIF.forEach((b) => {
        const d = doc(db, "biaya_tarif", b.id);
        batch.set(d, removeUndefinedFields(b));
      });

      // Seed transaksi
      INITIAL_TRANSAKSI.forEach((tx) => {
        const d = doc(db, "transaksi", tx.id);
        batch.set(d, removeUndefinedFields(tx));
      });

      // Seed petugas
      INITIAL_PETUGAS.forEach((ptg) => {
        const d = doc(db, "petugas", ptg.id);
        batch.set(d, removeUndefinedFields(ptg));
      });

      await batch.commit();
      console.log("Seeding completed successfully!");
    } else {
      // Check if petugas is empty separately (e.g. if database is already partially seeded from earlier app versions)
      const petSnap = await getDocs(petugasCol);
      if (petSnap.empty) {
        console.log("Seeding petugas separately...");
        const batch = writeBatch(db);
        INITIAL_PETUGAS.forEach((ptg) => {
          const d = doc(db, "petugas", ptg.id);
          batch.set(d, removeUndefinedFields(ptg));
        });
        await batch.commit();
        console.log("Petugas seeding completed!");
      }
    }
  } catch (error) {
    console.error("Error seeding initial data: ", error);
  }
};

// Real-time subscriptions
export const subscribePelanggan = (onUpdate: (data: Pelanggan[]) => void) => {
  return onSnapshot(pelangganCol, (snapshot) => {
    const list: Pelanggan[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Pelanggan);
    });
    // Sort or preserve order
    onUpdate(list);
  }, (err) => {
    console.error("Error fetching pelanggan snapshot: ", err);
  });
};

export const subscribeTanggal = (onUpdate: (data: TanggalPembayaran[]) => void) => {
  return onSnapshot(tanggalCol, (snapshot) => {
    const list: TanggalPembayaran[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as TanggalPembayaran);
    });
    onUpdate(list);
  }, (err) => {
    console.error("Error fetching tanggal snapshot: ", err);
  });
};

export const subscribeBiaya = (onUpdate: (data: BiayaTarif[]) => void) => {
  return onSnapshot(biayaCol, (snapshot) => {
    const list: BiayaTarif[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as BiayaTarif);
    });
    onUpdate(list);
  }, (err) => {
    console.error("Error fetching biaya snapshot: ", err);
  });
};

export const subscribeTransaksi = (onUpdate: (data: Transaksi[]) => void) => {
  return onSnapshot(transaksiCol, (snapshot) => {
    const list: Transaksi[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Transaksi);
    });
    // Sort transactions by date descending or ID descending
    list.sort((a, b) => b.id.localeCompare(a.id));
    onUpdate(list);
  }, (err) => {
    console.error("Error fetching transaksi snapshot: ", err);
  });
};

export const subscribePetugas = (onUpdate: (data: Petugas[]) => void) => {
  return onSnapshot(petugasCol, (snapshot) => {
    const list: Petugas[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Petugas);
    });
    // Sort by name
    list.sort((a, b) => a.nama.localeCompare(b.nama));
    onUpdate(list);
  }, (err) => {
    console.error("Error fetching petugas snapshot: ", err);
  });
};

// CRUD single item operations
export const savePelangganDoc = async (p: Pelanggan) => {
  const d = doc(db, "pelanggan", p.id);
  await setDoc(d, removeUndefinedFields(p));
};

export const savePelangganDocs = async (pelangganList: Pelanggan[]) => {
  if (pelangganList.length === 0) return;
  const chunkSize = 500;
  for (let i = 0; i < pelangganList.length; i += chunkSize) {
    const chunk = pelangganList.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((p) => {
      const d = doc(db, "pelanggan", p.id);
      batch.set(d, removeUndefinedFields(p));
    });
    await batch.commit();
  }
};

export const deletePelangganDoc = async (id: string) => {
  const d = doc(db, "pelanggan", id);
  await deleteDoc(d);
};

export const savePetugasDoc = async (p: Petugas) => {
  const d = doc(db, "petugas", p.id);
  await setDoc(d, removeUndefinedFields(p));
};

export const deletePetugasDoc = async (id: string) => {
  const d = doc(db, "petugas", id);
  await deleteDoc(d);
};

export const saveTanggalDoc = async (t: TanggalPembayaran) => {
  const d = doc(db, "tanggal_pembayaran", t.id);
  await setDoc(d, removeUndefinedFields(t));
};

export const deleteTanggalDoc = async (id: string) => {
  const d = doc(db, "tanggal_pembayaran", id);
  await deleteDoc(d);
};

export const saveBiayaDoc = async (b: BiayaTarif) => {
  const d = doc(db, "biaya_tarif", b.id);
  await setDoc(d, removeUndefinedFields(b));
};

export const deleteBiayaDoc = async (id: string) => {
  const d = doc(db, "biaya_tarif", id);
  await deleteDoc(d);
};

export const saveTransaksiDoc = async (tx: Transaksi) => {
  const d = doc(db, "transaksi", tx.id);
  await setDoc(d, removeUndefinedFields(tx));
};

export const saveTransaksiDocs = async (transaksiList: Transaksi[]) => {
  if (transaksiList.length === 0) return;
  const chunkSize = 500;
  for (let i = 0; i < transaksiList.length; i += chunkSize) {
    const chunk = transaksiList.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((tx) => {
      const d = doc(db, "transaksi", tx.id);
      batch.set(d, removeUndefinedFields(tx));
    });
    await batch.commit();
  }
};

export const deleteTransaksiDoc = async (id: string) => {
  const d = doc(db, "transaksi", id);
  await deleteDoc(d);
};

// Reset database to default
export const resetToDefaultDocs = async () => {
  const batch = writeBatch(db);

  // Get current docs to delete
  const pSnap = await getDocs(pelangganCol);
  pSnap.forEach((doc) => batch.delete(doc.ref));

  const tSnap = await getDocs(tanggalCol);
  tSnap.forEach((doc) => batch.delete(doc.ref));

  const bSnap = await getDocs(biayaCol);
  bSnap.forEach((doc) => batch.delete(doc.ref));

  const txSnap = await getDocs(transaksiCol);
  txSnap.forEach((doc) => batch.delete(doc.ref));

  const petSnap = await getDocs(petugasCol);
  petSnap.forEach((doc) => batch.delete(doc.ref));

  // Write new ones
  INITIAL_PELANGGAN.forEach((p) => {
    const d = doc(db, "pelanggan", p.id);
    batch.set(d, removeUndefinedFields(p));
  });

  INITIAL_TANGGAL_PEMBAYARAN.forEach((t) => {
    const d = doc(db, "tanggal_pembayaran", t.id);
    batch.set(d, removeUndefinedFields(t));
  });

  INITIAL_BIAYA_TARIF.forEach((b) => {
    const d = doc(db, "biaya_tarif", b.id);
    batch.set(d, removeUndefinedFields(b));
  });

  INITIAL_TRANSAKSI.forEach((tx) => {
    const d = doc(db, "transaksi", tx.id);
    batch.set(d, removeUndefinedFields(tx));
  });

  INITIAL_PETUGAS.forEach((ptg) => {
    const d = doc(db, "petugas", ptg.id);
    batch.set(d, removeUndefinedFields(ptg));
  });

  await batch.commit();
};

// Clear all database content
export const clearAllDocs = async () => {
  const batch = writeBatch(db);

  const pSnap = await getDocs(pelangganCol);
  pSnap.forEach((doc) => batch.delete(doc.ref));

  const tSnap = await getDocs(tanggalCol);
  tSnap.forEach((doc) => batch.delete(doc.ref));

  const bSnap = await getDocs(biayaCol);
  bSnap.forEach((doc) => batch.delete(doc.ref));

  const txSnap = await getDocs(transaksiCol);
  txSnap.forEach((doc) => batch.delete(doc.ref));

  const petSnap = await getDocs(petugasCol);
  petSnap.forEach((doc) => batch.delete(doc.ref));

  await batch.commit();
};
