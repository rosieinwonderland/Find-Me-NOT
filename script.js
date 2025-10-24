// -------------------------------
// Find Me Not Encryption Logic (AES-GCM)
// -------------------------------

function bufToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuf(str) {
  const bin = atob(str);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer;
}

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 200000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptText(text, password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text));

  const combined = new Uint8Array(salt.byteLength + iv.byteLength + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.byteLength);
  combined.set(new Uint8Array(ciphertext), salt.byteLength + iv.byteLength);

  return bufToBase64(combined.buffer);
}

async function decryptText(payload, password) {
  const data = new Uint8Array(base64ToBuf(payload));
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const ciphertext = data.slice(28);
  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
}

// -------------------------------
// UI Handlers
// -------------------------------

const plaintext = document.getElementById("plaintext");
const key = document.getElementById("key");
const cipher = document.getElementById("cipher");
const decrypted = document.getElementById("decrypted");
const key2 = document.getElementById("key2");
const encStatus = document.getElementById("encStatus");
const decStatus = document.getElementById("decStatus");

// Auto-clear outputs on input
plaintext.addEventListener("input", () => {
  cipher.value = "";
  decrypted.value = "";
  encStatus.textContent = "";
  decStatus.textContent = "";
});

cipher.addEventListener("input", () => {
  decrypted.value = "";
  decStatus.textContent = "";
});

key.addEventListener("input", () => encStatus.textContent = "");
key2.addEventListener("input", () => decStatus.textContent = "");

// Encrypt Button
document.getElementById("encryptBtn").onclick = async () => {
  const text = plaintext.value.trim();
  const password = key.value.trim();

  if (!text || !password) {
    encStatus.textContent = "❌ Enter both text and key.";
    encStatus.style.color = "red";
    return;
  }

  try {
    const cipherText = await encryptText(text, password);
    cipher.value = cipherText;
    encStatus.textContent = "✅ Encrypted successfully!";
    encStatus.style.color = "#0f0";
    decrypted.value = "";
    decStatus.textContent = "";
  } catch (e) {
    encStatus.textContent = "❌ Encryption failed.";
    encStatus.style.color = "red";
  }
};

// Decrypt Button
document.getElementById("decryptBtn").onclick = async () => {
  const cipherText = cipher.value.trim();
  const password = key2.value.trim();

  if (!cipherText || !password) {
    decStatus.textContent = "❌ Provide text and key.";
    decStatus.style.color = "red";
    return;
  }

  try {
    const plain = await decryptText(cipherText, password);
    decrypted.value = plain;
    decStatus.textContent = "✅ Key matched — Decrypted!";
    decStatus.style.color = "#0f0";
  } catch (e) {
    decStatus.textContent = "❌ Wrong key or corrupted data.";
    decrypted.value = "";
    decStatus.style.color = "red";
  }
};

// -------------------------------
// Matrix-style Cyberpunk Background
// -------------------------------

const canvas = document.getElementById('matrix-bg');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const letters = 'WONDERLAND';
const symbols = '01X'; // random symbols
const fontSize = 20;
const columns = Math.floor(canvas.width / fontSize);
const drops = Array(columns).fill(1);

// Randomly pick columns to show WONDERLAND in order
const wonderCols = [];
for (let i = 0; i < columns; i++) {
  if (Math.random() < 0.15) wonderCols.push(i); // ~15% of columns
}

function drawMatrix() {
  // Semi-transparent overlay for trail effect
  ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = fontSize + 'px monospace';

  for (let i = 0; i < drops.length; i++) {
    let text;
    if (wonderCols.includes(i)) {
      // Show WONDERLAND letters in order vertically
      const index = drops[i] % letters.length;
      text = letters.charAt(index);
      ctx.fillStyle = 'grey';
    } else {
      text = symbols.charAt(Math.floor(Math.random() * symbols.length));
      ctx.fillStyle = 'black';
    }

    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

    drops[i]++;
    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
  }
}

// Start animation at ~20fps
setInterval(drawMatrix, 50);

// Handle window resize
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
