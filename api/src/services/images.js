// Imagens dos produtos. Passo 8: no Azure Blob Storage (com STORAGE_CONN).
// Sem STORAGE_CONN (desenvolvimento), ficam na pasta api/uploads, servida pela própria API em /uploads.
// Em AWS: @aws-sdk/client-s3 · Em Google Cloud: @google-cloud/storage
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const { BlobServiceClient } = require('@azure/storage-blob');
const { HttpError } = require('../utils/httpError');

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const LOCAL_FOLDER = path.join(__dirname, '..', '..', 'uploads');

let container;
function getContainer() {
  if (!container) {
    container = BlobServiceClient
      .fromConnectionString(process.env.STORAGE_CONN)
      .getContainerClient(process.env.STORAGE_CONTAINER || 'products');
  }
  return container;
}

/**
 * @param {{ buffer: Buffer, mimetype: string }} file (multer)
 * @param {string} baseUrl URL da API, para o endereço das imagens guardadas localmente
 * @returns {Promise<string>} URL público da imagem
 */
async function saveImage(file, baseUrl) {
  const extension = TYPES[file?.mimetype];
  if (!extension) throw new HttpError(400, 'A fotografia tem de ser JPEG, PNG ou WebP');
  const name = `${crypto.randomUUID()}.${extension}`; // nunca o nome original, que vem do utilizador

  if (process.env.STORAGE_CONN) {
    const blob = getContainer().getBlockBlobClient(name);
    await blob.uploadData(file.buffer, { blobHTTPHeaders: { blobContentType: file.mimetype } });
    return blob.url;
  }
  await fs.mkdir(LOCAL_FOLDER, { recursive: true });
  await fs.writeFile(path.join(LOCAL_FOLDER, name), file.buffer);
  return `${baseUrl}/uploads/${name}`;
}

// Apaga a imagem antiga quando é substituída ou o produto é removido (sem falhar o pedido se não existir)
async function deleteImage(url) {
  if (!url) return;
  const name = url.split('/').pop();
  try {
    if (process.env.STORAGE_CONN && url.includes('.blob.core.windows.net')) await getContainer().deleteBlob(name);
    else if (url.includes('/uploads/')) await fs.unlink(path.join(LOCAL_FOLDER, path.basename(name)));
  } catch { /* já não existia */ }
}

module.exports = { saveImage, deleteImage, getContainer, LOCAL_FOLDER };
