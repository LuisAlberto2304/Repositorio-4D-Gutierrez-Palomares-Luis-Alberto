require("dotenv").config();
const admin = require("firebase-admin");

// Carga el archivo JSON de credenciales
const serviceAccount = require("./serviceAccountKey.json");
// Inicializa Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tecnix-52017-default-rtdb.firebaseio.com",
});

const db = admin.firestore();

// Nombre de la colección y
// nombre del archivo JS de los valores a insertar
const coleccion = "Component";

// Importación de los datos a insertar
const sampleData = require(`./data/${coleccion}.js`);

// Función para insertar datos
async function insertLocations() {
  const collectionRef = db.collection(coleccion);

  for (const data of sampleData) {
    try {
      await collectionRef.add(data);
      console.log(`Data "${data}" insertada correctamente.`);
    } catch (error) {
      console.error(`Error insertando "${data}":`, error);
    }
  }
  console.log("Inserción completada.");
}

// Ejecuta la función
insertLocations();
