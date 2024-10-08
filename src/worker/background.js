import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_SERVER_URL, { transports: ['websocket'] }); // Change the URL if your server is hosted elsewhere

let currentTab = null;
let notificationId = null;

async function notifyUser(title, message) {
  notificationId = await chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('./images/icon16.png'), // Add your extension's icon here
    title: title,
    message: message,
  });
  console.log('Notification ID:', notificationId);
}

// Handle notification click event
chrome.notifications.onClicked.addListener(function (currentNotificationId) {
  if (notificationId === currentNotificationId) {
    // Define the URL of the tab you want to open
    // const targetUrl = 'https://example.com';

    // Search for an existing tab with the target URL
    chrome.tabs.query({}, function (tabs) {
      let tabFound = false;

      for (let tab of tabs) {
        if (tab.id === currentTab.id) {
          // If tab is found, bring it to focus
          chrome.tabs.update(tab.id, { active: true });
          chrome.windows.update(tab.windowId, { focused: true });
          tabFound = true;
          break;
        }
      }
    });
  }
});

function sendMessageToContentScript(message, callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length > 0 && tabs[0].id === currentTab.id) {
      console.log('Tabs', tabs[0].id, currentTab?.id);
      chrome.tabs.sendMessage(tabs[0].id, message, callback);
    } else {
      console.log('No active tabs found');
      notifyUser('Story Pointer', 'You have a new story to point.');
    }
  });
}

/* function broadCastToAllConnectedTabs(message) {
  chrome.tabs.query({}, function (tabs) {
    // Loop through each tab
    tabs.forEach(function (tab) {
      // console.log("TAB =>", tab);
      // Send a message to the content script of each tab
      chrome.tabs.sendMessage(tab.id, message);
    });
  });
} */

function showContextMenu() {
  // Create a context menu item
  chrome.contextMenus.create({
    id: 'pointerContextMenu',
    title: 'Storypoint this text',
    contexts: ['selection'],
  });
}

//reconnect socket after idle time
chrome.idle.onStateChanged.addListener(function (state) {
  if (state === 'active') {
    console.log('Active state');
    socket.connect();
    // createOrJoinChannelCallback();
  } else {
    console.log('Idle state');
    socket.disconnect();
  }
});

// Add listener for context menu clicks
chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === 'pointerContextMenu') {
    // Perform the action when context menu item is clicked
    console.log('Context menu action clicked', info.selectionText);
    // Send a message from background script to another script
    sendMessageToContentScript({
      message: 'SELECT_QUESTION',
      question: info.selectionText,
    });
  }
});

// Listen for messages from the content script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log('Message from content script: ', request, socket.connected);

  if (request.message === 'CREATE_CHANNEL') {
    console.log('Create Channel', request);

    const createCallbackWrapper = (namespace, channel) => {
      console.log('Namespace', namespace, channel);
      sendResponse({ namespace, channel });
      createOrJoinChannelCallback(namespace, channel, request.name);
    };

    socket.emit(
      'CREATE_CHANNEL',
      {
        channel: request.channel || null,
        name: request.name,
        domain: request.domain,
      },
      createCallbackWrapper,
    );

    return true;
  }

  if (request.message === 'JOIN_CHANNEL') {
    console.log('Join Channel', request);

    const createCallbackWrapper = (namespace, channel) => {
      console.log('Namespace', namespace, channel);
      sendResponse({ namespace, channel });
      createOrJoinChannelCallback(namespace, channel, request.name);
    };

    socket.emit(
      'JOIN_CHANNEL',
      {
        channel: request.channel,
        name: request.name,
        domain: request.domain,
      },
      createCallbackWrapper,
    );

    return true;
  }

  if (request.message === 'GET_LAST_QUERY') {
    socket.emit('GET_LAST_QUERY', {
      channel: request.channel,
      domain: request.domain,
    });
  }

  /* if (request.message === "JOIN_CHANNEL") {
    // socket.join(request.channel);

    
    socket.emit("JOIN_CHANNEL", {
      channel: request.channel,
      name: request.name,
      domain: request.domain,
    });
    sendMessageToContentScript({
      message: "ADD_SESSION_DATA",
      channel: request.channel,
      name: request.name,
    });
  } */

  if (request.message === 'LEAVE_CHANNEL') {
    socket.emit('LEAVE_CHANNEL', {
      channel: request.channel,
      name: request.name,
      domain: request.domain,
    });
    sendMessageToContentScript({
      message: 'DELETE_SESSION_DATA',
    });
  }

  if (request.message === 'QUESTION_CONFIRMED') {
    console.log('Question confirmed', request.question, request.channel);
    socket.emit('SELECTED_QUESTIONS', {
      channel: request.channel,
      question: request.question,
      domain: request.domain,
    });
  }

  if (request.message === 'VOTED_FOR_QUESTION') {
    console.log('Question Voted by user', request.question, request.channel);
    socket.emit('VOTED_FOR_QUESTION', {
      channel: request.channel,
      question: request.question,
      user: request.user,
      value: request.value,
      domain: request.domain,
    });
  }

  // Send a response back to the content script
  // sendResponse({response: "Message received by the background script!"});

  if (request.message === 'FETCH_SESSION_DATA') {
    console.log('Fetching session data', request);
    currentTab = request.tab; // assign request tab to currentTab
    sendMessageToContentScript(
      {
        message: 'GET_SESSION_DATA',
      },

      function (response) {
        console.log('Session data =>', response);
        if (response && response.data) {
          const ns = `/${response.data.domain}-${response.data.channel}`;
          createOrJoinChannelCallback(ns, response.data.channel, response.data.user);
          sendResponse(response);
        }
      },
    );
    return true;
  }

  /* if (request.message === "SESSION_DATA") {
    console.log("Session data", request, sender);
    sendResponse({ data: { user: "muthu", channel: "Test" } });
  } */
});

/* socket.on("PARTICIPANTS", (data) => {
  console.log("particpants received in background", data);
  broadCastToAllConnectedTabs({
    message: "ADD_PARTICIPANTS",
    participants: data,
  });
}); */

/* socket.on("VOTE_FOR_QUESTION", (question) => {
  console.log("Questions", question);

  broadCastToAllConnectedTabs({
    message: "VOTE_QUESTION",
    question,
  });
});

socket.on("REVEAL_VOTES", ({ question, votes }) => {
  console.log("Questions", question, votes);
  broadCastToAllConnectedTabs({
    message: "REVEAL_VOTES",
    question,
    votes,
  });
});
 */

// Create socket channel using namespace

const createOrJoinChannelCallback = (namespace, channel, name) => {
  console.log(`Connecting to namespace: ${namespace}`);

  // Connect to the dynamic namespace
  const nsSocket = io(import.meta.env.VITE_SOCKET_SERVER_URL + namespace);
  nsSocket.on('connect', () => {
    console.log('Connected to namespace:', namespace);
    console.log('Channel', channel);
    nsSocket.emit('CONNECT', channel);
    showContextMenu();
  });

  // Listen for the 'welcome' message from the new namespace
  nsSocket.on('welcome', (message) => {
    console.log('Welcome message from namespace:', message);
  });

  nsSocket.on('joined_room', (message) => {
    console.log(message);
  });

  nsSocket.on('PARTICIPANTS', (data) => {
    console.log('particpants received in background', data);
    sendMessageToContentScript({
      message: 'ADD_PARTICIPANTS',
      participants: data,
    });
  });

  nsSocket.on('PARTICIPANTS_REMAIN', (participants) => {
    console.log('Participants remaining', participants);
    sendMessageToContentScript({
      message: 'PARTICIPANTS_REMAIN',
      participants,
    });
  });

  nsSocket.on('VOTE_FOR_QUESTION', (question) => {
    console.log('Questions', question);

    sendMessageToContentScript({
      message: 'VOTE_QUESTION',
      question,
    });
  });

  nsSocket.on('REVEAL_VOTES', ({ question, votes }) => {
    console.log('Questions', question, votes);
    sendMessageToContentScript({
      message: 'REVEAL_VOTES',
      question,
      votes,
    });
  });

  nsSocket.on('CHANNEL_NOT_FOUND', ({ channel, namespace }) => {
    console.log('Channel not found', channel, namespace);
    /* sendMessageToContentScript({
      message: "CHANNEL_NOT_FOUND",
      channel,
      namespace,
    }); */
  });

  sendMessageToContentScript({
    message: 'ADD_SESSION_DATA',
    channel,
    name,
  });
};

// socket.on("CREATED_CHANNEL", createOrJoinChannelCallback);
// socket.on("JOINED_CHANNEL", createOrJoinChannelCallback);

socket.on('CHANNEL_NOT_FOUND', (response) => {
  console.log('Channel not found', response);
  // clear the session data
  sendMessageToContentScript({
    message: 'DELETE_SESSION_DATA',
  });
});
