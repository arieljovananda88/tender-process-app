import { useState } from "react";

const DB_NAME = "MyDB";
const STORE_NAME = "Keys";

// Helper to convert base64 to hex
const base64ToHex = (base64: string) => {
  const binary = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
  return '0x' + Array.from(binary)
    .map(b => b.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
};

// IndexedDB helpers
const dropDatabase = () =>
  new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => {
      console.log("Database deleted successfully");
      resolve();
    };
    req.onerror = () => {
      console.error("Error deleting database");
      reject(req.error);
    };
  });

const saveToIndexedDB = (keyJwk: JsonWebKey, id = "user-private-key") =>
  new Promise<void>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      db.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    req.onsuccess = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put({ id, key: keyJwk });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });

const loadFromIndexedDB = (id = "user-private-key") =>
  new Promise<JsonWebKey | undefined>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    req.onsuccess = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);
      getReq.onsuccess = () => resolve(getReq.result?.key);
      getReq.onerror = () => reject(getReq.error);
    };
    req.onerror = () => reject(req.error);
  });

export default function KeyDemo() {
  const [pubKey, setPubKey] = useState<JsonWebKey | null>(null);
  const [privKey, setPrivKey] = useState<JsonWebKey | null>(null);
  const [output, setOutput] = useState("");

  const handleDropDatabase = async () => {
    try {
      await dropDatabase();
      setPrivKey(null);
      setPubKey(null);
      setOutput("Database deleted successfully");
    } catch (error) {
      console.error("Error dropping database:", error);
      setOutput("Error dropping database: " + (error as Error).message);
    }
  };

  const fetchKey = async () => {
    try {
      const key = await loadFromIndexedDB();
      if (key) {
        setPrivKey(key);
        setOutput("Key loaded from IndexedDB");
      } else {
        setPrivKey(null);
        console.log("tes")
        setOutput("No key found in IndexedDB. Please generate a new key pair first.");
        // Optionally auto-generate a new key pair
        const shouldGenerate = window.confirm("Would you like to generate a new key pair?");
        if (shouldGenerate) {
          await generateKeyPair();
        }
      }
    } catch (error) {
        const shouldGenerate = window.confirm("Would you like to generate a new key pair?");
        if (shouldGenerate) {
            await generateKeyPair();
        }
      console.error("Error fetching key:", error);
      setOutput("Error fetching key: " + (error as Error).message);
    }
  };

  const generateKeyPair = async () => {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: "P-256",
      },
      true,
      ["deriveKey"]
    );

    const pubJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    const privJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

    await saveToIndexedDB(privJwk);

    setPubKey(pubJwk);
    setPrivKey(privJwk);
    setOutput("Key pair generated and private key saved to IndexedDB.");
  };

  const testEncryptDecrypt = async () => {
    try {
      // Peer (simulated)
      const peerKeyPair = await crypto.subtle.generateKey(
        {
          name: "ECDH",
          namedCurve: "P-256",
        },
        true,
        ["deriveKey"]
      );

      const peerPublicKey = peerKeyPair.publicKey;

      // Load from IndexedDB
      const privJwk = await loadFromIndexedDB();
      if (!privJwk) throw new Error("No private key found");
      
      const privateKey = await crypto.subtle.importKey(
        "jwk",
        privJwk,
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey"]
      );

      const sharedKey = await crypto.subtle.deriveKey(
        {
          name: "ECDH",
          public: peerPublicKey,
        },
        privateKey,
        {
          name: "AES-GCM",
          length: 256,
        },
        false,
        ["encrypt", "decrypt"]
      );

      // Encrypt
      const encoder = new TextEncoder();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const plaintext = encoder.encode("hello world");

      const ciphertext = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv,
        },
        sharedKey,
        plaintext
      );

      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv,
        },
        sharedKey,
        ciphertext
      );

      const decoded = new TextDecoder().decode(decrypted);
      setOutput(`Decrypted: ${decoded}`);
    } catch (e) {
      console.error(e);
      setOutput("Error during encrypt/decrypt: " + (e as Error).message);
    }
  };

  return (
    <div className="p-4 space-y-4 font-mono text-sm">
      <button
        onClick={handleDropDatabase}
        className="bg-red-600 text-white px-4 py-2 rounded"
      >
        Drop Database
      </button>

      <button
        onClick={fetchKey}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Fetch Key
      </button>

      <button
        onClick={generateKeyPair}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Generate Key Pair
      </button>

      <button
        onClick={testEncryptDecrypt}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Encrypt & Decrypt Message
      </button>

      {pubKey && (
        <div>
          <h3 className="font-bold mt-4">🔑 Public Key (JWK)</h3>
          <pre className="bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(pubKey, null, 2)}
          </pre>
          <h4 className="font-bold mt-2">Public Key (String)</h4>
          <pre className="bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(pubKey)}
          </pre>
          <h4 className="font-bold mt-2">Public Key (Hex)</h4>
          <pre className="bg-gray-100 p-2 rounded overflow-auto">
            x: {base64ToHex(pubKey.x || '')}
            y: {base64ToHex(pubKey.y || '')}
          </pre>
        </div>
      )}

      {privKey && (
        <div>
          <h3 className="font-bold mt-4">🔒 Private Key (JWK)</h3>
          <pre className="bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(privKey, null, 2)}
          </pre>
          <h4 className="font-bold mt-2">Private Key (String)</h4>
          <pre className="bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(privKey)}
          </pre>
          <h4 className="font-bold mt-2">Private Key (Hex)</h4>
          <pre className="bg-gray-100 p-2 rounded overflow-auto">
            d: {base64ToHex(privKey.d || '')}
          </pre>
        </div>
      )}

      <p className="mt-4 text-blue-800">{output}</p>
    </div>
  );
}
