require("dotenv").config();
const express = require("express");
const multer = require("multer");
const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const upload = multer({ dest: "uploads/" });

// Genera un estado único
const state = crypto.randomBytes(16).toString("hex");

// Configura OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  process.env.GOOGLE_OAUTH_REDIRECT_URIS,
);

// Genera la URL de autorización
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/drive.file"],
  state: state, // Incluye el estado
});

console.log("Autoriza esta aplicación visitando esta URL:", authUrl);
let oauth2Tokens = null;
// Ruta para manejar la redirección desde Google
app.get("/callback", async (req, res) => {
  try {
    const { code, state: stateFromGoogle } = req.query;

    // Verifica el estado
    if (stateFromGoogle !== state) {
      return res.status(400).send("Estado no válido");
    }

    // Intercambia el código por un token
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Almacena el token en memoria
    oauth2Tokens = tokens;
    console.log("Token almacenado en memoria");

    res.send("Autenticación exitosa. Puedes cerrar esta ventana.");
  } catch (error) {
    console.error("Error al obtener el token:", error);
    res.status(500).send("Error al autenticar");
  }
});

// Ruta para subir una imagen
app.post("/upload", upload.single("imagen"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const folderName = req.body.sucursal;

    // Sube el archivo a Google Drive
    const fileId = await uploadFile(filePath, folderName);

    // Obtén la URL pública del archivo
    const fileUrl = await makeFilePublic(fileId);

    // Elimina el archivo temporal
    fs.unlinkSync(filePath);

    res.status(200).json({ message: "Imagen subida", fileUrl });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Error al subir la imagen" });
  }
});

// Función para subir un archivo a Google Drive
async function uploadFile(filePath, folderName) {
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  // Busca o crea la carpeta de la sucursal
  const folderResponse = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
    fields: "files(id)",
  });

  let folderId;
  if (folderResponse.data.files.length > 0) {
    folderId = folderResponse.data.files[0].id;
  } else {
    const folderMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    };
    const folder = await drive.files.create({
      resource: folderMetadata,
      fields: "id",
    });
    folderId = folder.data.id;
  }

  // Sube el archivo a la carpeta
  const fileMetadata = {
    name: path.basename(filePath),
    parents: [folderId],
  };
  const media = {
    mimeType: "image/jpeg",
    body: fs.createReadStream(filePath),
  };
  const file = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: "id",
  });

  return file.data.id;
}

// Función para hacer público un archivo
async function makeFilePublic(fileId) {
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });
  const file = await drive.files.get({ fileId, fields: "webViewLink" });
  return file.data.webViewLink;
}

// Inicia el servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
