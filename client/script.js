const socket = io();
let room = "";
let username = "";

document.getElementById("messageInput").addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

function generateRoomCode() {
  const code = Math.random().toString(36).substr(2, 6).toUpperCase();
  document.getElementById("room").value = code;
}

function joinRoom() {
  room = document.getElementById("room").value.trim();
  username = document.getElementById("username").value.trim() || "Anonymous";

  if (!room) {
    alert("Please enter a room code.");
    return;
  }

  document.getElementById("home").style.display = "none";
  document.getElementById("chat").style.display = "block";
  document.getElementById("roomLabel").innerText = room;

  socket.emit("joinRoom", { room, username });
}

function sendMessage() {
  const input = document.getElementById("messageInput");
  const message = input.value.trim();
  if (message) {
    displayMessage({ username: "You", message, self: true });
    socket.emit("sendMessage", { room, message, username });
    input.value = "";
  }
}

function exitRoom() {
  socket.emit("leaveRoom", { room, username });
  document.getElementById("chat").style.display = "none";
  document.getElementById("home").style.display = "block";
}

function copyRoomLink() {
  const url = `${window.location.origin}?room=${room}`;
  navigator.clipboard.writeText(url);
  alert("Room link copied!");
}

function displayMessage({ username, message, self = false, system = false }) {
  const msgBox = document.getElementById("messages");
  const div = document.createElement("div");
  div.style.padding = "8px";
  div.style.margin = "5px 0";
  div.style.borderRadius = "8px";
  div.style.whiteSpace = "pre-wrap";

  if (system) {
    div.style.background = "#ffeaa7";
    div.style.color = "#2d3436";
    div.innerText = message;
  } else {
    div.style.background = "transparent";
    div.style.textAlign = self ? "right" : "left";
    div.innerHTML = self ? `<b>${username}:</b><br>${message}` : `<b>${username}:</b><br>${message}`;
  }

  msgBox.appendChild(div);
  msgBox.scrollTop = msgBox.scrollHeight;
}

socket.on("receiveMessage", (data) => {
  displayMessage({ username: data.username, message: data.message });
});

socket.on("userJoined", (data) => {
  displayMessage({ message: `${data.username} joined the chat.`, system: true });
  updateUserCount(data.count);
});

socket.on("userLeft", (data) => {
  displayMessage({ message: `${data.username} left the chat.`, system: true });
  updateUserCount(data.count);
});

function updateUserCount(count) {
  let label = document.getElementById("roomLabel");
  label.innerText = `${room} (${count} online)`;
}