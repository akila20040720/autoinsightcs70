import admin from "firebase-admin";
import fs from "fs";
import csv from "csv-parser";

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

let batch = db.batch();
let count = 0;

fs.createReadStream("vehicles.csv")
  .pipe(csv())
  .on("data", (row) => {
    const docRef = db.collection("vehicles").doc();

    batch.set(docRef, {
      make: row.Make?.toLowerCase(),
      model: row.Model?.toLowerCase(),
      district: row.District,
      price: Number(row.Price),
      mileage: Number(row.Milleage),
      year: Number(row.Year),
      vehicleType: row["Vehicle Type"],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    count++;

    // Firestore allows max 500 operations per batch
    if (count % 500 === 0) {
      batch.commit();
      batch = db.batch();
      console.log(`Imported ${count} vehicles...`);
    }
  })
  .on("end", async () => {
    await batch.commit();
    console.log("✅ All vehicles imported successfully!");
  });