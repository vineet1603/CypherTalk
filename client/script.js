const socket = io();
let currentRoom = '';
let key = null;


function generateRoomCode() {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  document.getElementById("room").value = code;
}

async function generateKey() {
  const enc = new TextEncoder();
  const roomBytes = enc.encode(currentRoom.padEnd(16, '0').slice(0, 16)); // 128-bit key from room
  key = await window.crypto.subtle.importKey(
    "raw",
    roomBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

function joinRoom() {
  const room = document.getElementById("room").value.trim();
  if (!room) return alert("Enter a room code");

  currentRoom = room;
  document.getElementById("roomLabel").textContent = room;
  document.getElementById("home").style.display = "none";
  document.getElementById("chat").style.display = "block";

  socket.emit("joinRoom", room);
  generateKey();
}

function exitRoom() {
  location.href = "/";
}

function copyRoomLink() {
  const link = `${location.origin}?room=${currentRoom}`;
  navigator.clipboard.writeText(link).then(() => {
    alert("Room link copied!");
  }).catch(err => {
    alert("Failed to copy link.");
  });
}

async function sendMessage() {
  const input = document.getElementById("messageInput");
  const message = input.value;
  if (!message) return;

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(message)
  );

  const payload = {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  };

  socket.emit("sendMessage", { room: currentRoom, message: payload });
  appendMessage(`You: ${message}`);
  input.value = '';
}

socket.on("receiveMessage", async (payload) => {
  const iv = new Uint8Array(payload.iv);
  const data = new Uint8Array(payload.data);

  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );
    const dec = new TextDecoder();
    appendMessage(`Stranger: ${dec.decode(decrypted)}`);
  } catch (e) {
    appendMessage("[Error decrypting message]");
  }
});

function appendMessage(msg) {
  const box = document.getElementById("messages");
  const div = document.createElement("div");
  div.textContent = msg;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}
