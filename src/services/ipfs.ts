import { create } from 'ipfs-http-client';
import { Buffer } from 'buffer';

// This client is configured to connect to a local IPFS node by default.
// For a production web application, this should be configured to connect
// to a pinning service like Infura or Pinata with authentication.
const client = create();

// ⚡ Bolt: In-memory cache for IPFS downloads
// We use a simple Map to cache downloaded IPFS data by its CID.
// This avoids redundant network requests for the same content,
// significantly speeding up repeated access.
const ipfsCache = new Map<string, Buffer>();

/**
 * Uploads data to IPFS.
 *
 * @note For this to work in a production web application, the `client` above
 * must be configured with credentials for a pinning service.
 * @param data The data to upload.
 * @returns The IPFS CID of the uploaded data.
 */
export async function uploadToIPFS(data: any) {
  const { cid } = await client.add(data);
  return cid;
}

/**
 * Downloads data from IPFS using a public gateway.
 *
 * @param cid The IPFS CID of the data to download.
 * @returns The downloaded data as a Buffer.
 */
export async function downloadFromIPFS(cid: string): Promise<Buffer> {
  // ⚡ Bolt: Check the cache first to avoid a slow network request.
  if (ipfsCache.has(cid)) {
    return ipfsCache.get(cid)!;
  }

  const response = await fetch(`https://ipfs.io/ipfs/${cid}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch from IPFS gateway: ${response.statusText}`
    );
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // ⚡ Bolt: Store the downloaded data in the cache for future requests.
  ipfsCache.set(cid, buffer);

  return buffer;
}
