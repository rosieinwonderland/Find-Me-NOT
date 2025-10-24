// Find Me Not Encryption Logic (AES-GCM)
function bufToBase64(b){return btoa(String.fromCharCode(...new Uint8Array(b)));}
function base64ToBuf(s){const bin=atob(s);const arr=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i);return arr.buffer;}

async function deriveKey(password,salt,iters=200000){
  const enc=new TextEncoder();
  const keyMaterial=await crypto.subtle.importKey("raw",enc.encode(password),"PBKDF2",false,["deriveKey"]);
  return crypto.subtle.deriveKey(
    {name:"PBKDF2",salt,iterations:iters,hash:"SHA-256"},
    keyMaterial,
    {name:"AES-GCM",length:256},
    false,["encrypt","decrypt"]
  );
}

async function encryptText(text,password){
  const enc=new TextEncoder();
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await deriveKey(password,salt);
  const ciphertext=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,enc.encode(text));
  const combined=new Uint8Array(salt.byteLength+iv.byteLength+ciphertext.byteLength);
  combined.set(salt,0);
  combined.set(iv,salt.byteLength);
  combined.set(new Uint8Array(ciphertext),salt.byteLength+iv.byteLength);
  return bufToBase64(combined.buffer);
}

async function decryptText(payload,password){
  const data=new Uint8Array(base64ToBuf(payload));
  const salt=data.slice(0,16);
  const iv=data.slice(16,28);
  const ciphertext=data.slice(28);
  const key=await deriveKey(password,salt);
  const decrypted=await crypto.subtle.decrypt({name:"AES-GCM",iv},key,ciphertext);
  return new TextDecoder().decode(decrypted);
}

// UI
document.getElementById('encryptBtn').onclick=async()=>{
  const text=document.getElementById('plaintext').value.trim();
  const key=document.getElementById('key').value.trim();
  const status=document.getElementById('encStatus');
  if(!text||!key){status.textContent="❌ Enter both text and key.";status.style.color="red";return;}
  try{
    const cipher=await encryptText(text,key);
    document.getElementById('cipher').value=cipher;
    status.textContent="✅ Encrypted successfully!";
    status.style.color="#0f0";
  }catch(e){
    status.textContent="❌ Encryption failed.";
    status.style.color="red";
  }
};

document.getElementById('decryptBtn').onclick=async()=>{
  const cipher=document.getElementById('cipher').value.trim();
  const key=document.getElementById('key2').value.trim();
  const status=document.getElementById('decStatus');
  if(!cipher||!key){status.textContent="❌ Provide text and key.";status.style.color="red";return;}
  try{
    const plain=await decryptText(cipher,key);
    document.getElementById('decrypted').value=plain;
    status.textContent="✅ Key matched — Decrypted!";
    status.style.color="#0f0";
  }catch(e){
    status.textContent="❌ Wrong key or corrupted data.";
    status.style.color="red";
  }
};
// --- Find Me Not ---
// Simple AES-GCM encryption/decryption using password as key

async function getKeyFromPassword(password) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("find-me-not-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptText() {
  const input = document.getElementById("inputText").value;
  const password = document.getElementById("password").value;
  if (!input || !password) return alert("Please enter text and password.");

  const key = await getKeyFromPassword(password);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const encoded = enc.encode(input);
  const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(cipherBuffer), iv.length);

  document.getElementById("outputText").value = btoa(String.fromCharCode(...combined));
}

async function decryptText() {
  const input = document.getElementById("inputText").value;
  const password = document.getElementById("password").value;
  if (!input || !password) return alert("Please enter encrypted text and password.");

  try {
    const data = Uint8Array.from(atob(input), c => c.charCodeAt(0));
    const iv = data.slice(0, 12);
    const ciphertext = data.slice(12);
    const key = await getKeyFromPassword(password);
    const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    const dec = new TextDecoder();
    document.getElementById("outputText").value = dec.decode(plainBuffer);
  } catch (e) {
    alert("Decryption failed. Wrong password or corrupted data.");
  }
}

document.getElementById("encryptBtn").addEventListener("click", encryptText);
document.getElementById("decryptBtn").addEventListener("click", decryptText);
