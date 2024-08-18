chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // if (request.message === "Hello from popup!") {
  console.log("Message received in content script:", request);

  /* if (
    request.message === "SHOW_PANEL" &&
    sessionStorage.getItem(STORAGE_KEY.CHANNEL) === null
  ) {
    createChannelModel = generateHTML(CreatePanel());
    body.appendChild(createChannelModel);
    setEvents();
    return;
  } */

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
