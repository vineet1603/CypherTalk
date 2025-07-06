const socket = io();
let room = "";
let username = "";
let replyTo = null;

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
    const payload = { room, message, username };
    if (replyTo) {
      payload.reply = replyTo;
    }
    displayMessage({ username: "You", message, reply: replyTo, self: true });
    socket.emit("sendMessage", payload);
    input.value = "";
    replyTo = null;
    document.getElementById("replyPreview").style.display = "none";
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

function setReply(messageText) {
  replyTo = messageText;
  const preview = document.getElementById("replyPreview");
  preview.innerHTML = `<small>Replying to:</small><br><i>"${messageText}"</i>`;
  preview.style.display = "block";
}

function addEmoji(target, emoji) {
  const current = target.querySelector(".emoji-bar");
  if (!current.innerText.includes(emoji)) {
    current.innerText += " " + emoji;
  }
}

function displayMessage({ username, message, self = false, system = false, reply = null }) {
  const msgBox = document.getElementById("messages");
  const div = document.createElement("div");
  div.style.padding = "8px";
  div.style.margin = "5px 0";
  div.style.borderRadius = "8px";
  div.style.whiteSpace = "pre-wrap";
  div.style.background = "transparent";
  div.style.position = "relative";

  if (system) {
    div.innerText = message;
    div.style.color = "#ffeb3b";
  } else {
    div.innerHTML = reply ? `<small><i>In reply to:</i><br>"${reply}"</small><br>` : "";
    div.innerHTML += `<b>${username}:</b><br>${message}`;

    const tools = document.createElement("div");
    tools.style.fontSize = "0.8em";
    tools.style.marginTop = "4px";

    const replyBtn = document.createElement("button");
    replyBtn.innerText = "↩ Reply";
    replyBtn.style.marginRight = "8px";
    replyBtn.onclick = () => setReply(message);

    const emojiBar = document.createElement("span");
    emojiBar.className = "emoji-bar";
    emojiBar.style.marginLeft = "10px";

    const emojis = ["👍", "❤️", "😂"];
    emojis.forEach(em => {
      const btn = document.createElement("button");
      btn.innerText = em;
      btn.onclick = () => addEmoji(div, em);
      btn.style.marginRight = "5px";
      btn.style.cursor = "pointer";
      tools.appendChild(btn);
    });

    tools.appendChild(replyBtn);
    tools.appendChild(emojiBar);
    div.appendChild(tools);
  }

  msgBox.appendChild(div);
  msgBox.scrollTop = msgBox.scrollHeight;
}

socket.on("receiveMessage", (data) => {
  displayMessage({ username: data.username, message: data.message, reply: data.reply });
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