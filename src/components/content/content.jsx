/* import html from "./content.html?raw";

const iframe = new DOMParser().parseFromString(html, "text/html").body
  .firstElementChild;
iframe.src = chrome.runtime.getURL("pages/iframe.html");

document.body.append(iframe); */

const body = document.querySelector("body");
let createChannelModel = null;
// injectCSS();
const participantsLocal = new Map();
const STORAGE_KEY = {
  CHANNEL: "CHANNEL",
  USER: "USER",
  PARTICIPANTS: "PARTICIPANTS",
};

const addParticipants = (channel, name) => {
  console.log("Adding participants", channel, name);
  if (participants.has(channel)) {
    console.log("Channel already exists", channel);
    return;
  }
  participants.set(channel, name);
  console.log("Participants", participants);
  sessionStorage.setItem(
    STORAGE_KEY.PARTICIPANTS,
    JSON.stringify(Array.from(participants.entries()))
  );
  // frameParticipantsPanel(participants);
};

const frameParticipantsPanel = (participants) => {
  const panel = document.createElement("div");
  panel.style.position = "fixed";
  panel.style.bottom = "0";
  panel.style.left = "0";
  panel.style.backgroundColor = "white";
  panel.style.border = "1px solid black";
  panel.style.padding = "10px";
  panel.style.zIndex = "1000";
  panel.style.display = "flex";
  panel.style.flexDirection = "column";
  panel.style.alignItems = "center";
  panel.style.justifyContent = "center";
  panel.style.borderRadius = "10px";
  panel.style.boxShadow = "0 0 10px 0 rgba(0,0,0,0.2)";

  const title = document.createElement("h3");
  title.innerText = "Participants";
  panel.appendChild(title);

  const list = document.createElement("ul");
  list.classList.add("participants-list");
  participants.forEach((name) => {
    const item = document.createElement("li");
    item.innerText = name;
    list.appendChild(item);
  });
  panel.appendChild(list);
  //store particpnat list in seession storage
  sessionStorage.setItem(
    STORAGE_KEY.PARTICIPANTS,
    JSON.stringify(participants)
  );
  document.body.appendChild(panel);
};

const showResultsPanel = (question, participants) => {
  const panel = document.createElement("div");
  panel.style.position = "fixed";
  panel.style.bottom = "0";
  panel.style.left = "0";
  panel.style.backgroundColor = "white";
  panel.style.border = "1px solid black";
  panel.style.padding = "10px";
  panel.style.zIndex = "1000";
  panel.style.display = "flex";
  panel.style.flexDirection = "column";
  panel.style.alignItems = "center";
  panel.style.justifyContent = "center";
  panel.style.borderRadius = "10px";
  panel.style.boxShadow = "0 0 10px 0 rgba(0,0,0,0.2)";

  const title = document.createElement("h3");
  title.innerText = "Voted for question: " + question;
  panel.appendChild(title);

  document.querySelector(".participants-list").style.display = "none";

  const list = document.createElement("ul");
  list.classList.add("result-list");
  participants.forEach((participant) => {
    const item = document.createElement("li");
    item.innerText = `${participant.name} - ${participant.value}`;
    list.appendChild(item);
  });
  panel.appendChild(list);

  const button = document.createElement("button");
  button.innerText = "Clear";
  button.addEventListener("click", () => {
    document.querySelector(".participants-list").style.display = "block";
    panel.remove();
  });
  panel.appendChild(button);

  document.body.appendChild(panel);
};

const participantsFromStorage = sessionStorage.getItem(
  STORAGE_KEY.PARTICIPANTS
);
if (participantsFromStorage) {
  const storedParticipants = JSON.parse(participantsFromStorage);
  console.log("Stored participants", storedParticipants);
  if (storedParticipants.length > 0) {
    frameParticipantsPanel(storedParticipants);
  }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // if (request.message === "Hello from popup!") {
  console.log("Message received in content script:", request);

  if (
    request.message === "SHOW_PANEL" &&
    sessionStorage.getItem(STORAGE_KEY.CHANNEL) === null
  ) {
    createChannelModel = generateHTML(CreatePanel());
    body.appendChild(createChannelModel);
    setEvents();
    return;
  }

  /* if (request.message === "ADD_PARTICIPANTS") {
    const participantsList = request.participants;
    const channel = sessionStorage.getItem(STORAGE_KEY.CHANNEL);
    participantsList.forEach((name) => {
      participants.set(channel, { name: name, value: "?" });
    });
    frameParticipantsPanel(participants);
  } */

  if (request.message === "ADD_PARTICIPANTS") {
    const participantsList = request.participants;
    frameParticipantsPanel(participantsList);
  }

  if (request.message === "ADD_SESSION_DATA") {
    console.log(request.channel, request.name);
    sessionStorage.setItem(STORAGE_KEY.CHANNEL, request.channel);
    sessionStorage.setItem(STORAGE_KEY.USER, request.name);
    // addParticipants(request.channel, request.name);
  }

  if (request.message === "SELECT_QUESTION") {
    console.log("Questions", request.question);
    const confirmed = confirm(`Do you want to ask: ${request.question}?`);
    if (confirmed) {
      // Send a message to the background script
      chrome.runtime.sendMessage({
        message: "QUESTION_CONFIRMED",
        question: request.question,
        channel: sessionStorage.getItem(STORAGE_KEY.CHANNEL),
      });
    }
  }

  if (request.message === "VOTE_QUESTION") {
    const question = request.question;
    const vote = prompt(`What's your vote for : ${question} ? (1,2,3,5,8)`);
    if (vote) {
      chrome.runtime.sendMessage({
        message: "VOTED_FOR_QUESTION",
        channel: sessionStorage.getItem(STORAGE_KEY.CHANNEL),
        user: sessionStorage.getItem(STORAGE_KEY.USER),
        question,
        value: vote,
      });
    }
  }

  if (request.message === "REVEAL_VOTES") {
    const question = request.question;
    const userVotes = request.votes;
    // const channel = sessionStorage.getItem(STORAGE_KEY.CHANNEL);
    const participantsList = [];
    const participants = JSON.parse(
      sessionStorage.getItem(STORAGE_KEY.PARTICIPANTS)
    );
    console.log("Participants", participants.length, userVotes.length);
    if (userVotes.length === participants.length) {
      userVotes.forEach((data) => {
        participantsList.push({ name: data.user, value: data.value });
        // participants.set(channel, { name: data.user, value: data.value });
        console.log(`User: ${data.user} voted for ${data.value}`);
      });
      showResultsPanel(question, participantsList);
    } else {
      console.log("Participants not voted yet", userVotes);
    }
  }

  if (request.message === "GET_SESSION_DATA") {
    sendResponse({
      data: {
        user: sessionStorage.getItem(STORAGE_KEY.USER),
        channel: sessionStorage.getItem(STORAGE_KEY.CHANNEL),
      },
    });
  }

  if (request.message === "DELETE_SESSION_DATA") {
    sessionStorage.removeItem(STORAGE_KEY.CHANNEL);
    sessionStorage.removeItem(STORAGE_KEY.USER);
    sessionStorage.removeItem(STORAGE_KEY.PARTICIPANTS);
  }
});

function setEvents() {
  document
    .querySelector(".join_channel button")
    .addEventListener("click", () => {
      console.log("Creating channel");
      const userName = document.querySelector("#name").value;
      const channelName = document.querySelector("#channel_name").value;
      sessionStorage.setItem(STORAGE_KEY.CHANNEL, channelName);
      sessionStorage.setItem(STORAGE_KEY.USER, userName);
      // addParticipants(channelName, userName);
      chrome.runtime.sendMessage({
        message: "JOIN_CHANNEL",
        channel: channelName,
        name: userName,
      });
      createChannelModel.style.display = "none";
    });
}
