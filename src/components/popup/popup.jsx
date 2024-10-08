import { useEffect, useState } from 'react';
import { Labels } from './LabelConstants';
import './popup.scss';

function PopupRoot() {
  const [userName, setUserName] = useState(null);
  const [channelName, setChannelName] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [domain, setDomain] = useState(null);
  const [isCreateChannel, setIsCreateChannel] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentTab, setCurrentTab] = useState(null);
  const [isNameError, setIsNameError] = useState(false);
  const [isChannelError, setIsChannelError] = useState(false);

  console.log(isConnected, userName, channelName);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var currentTab = tabs[0];
      var url = new URL(currentTab.url);
      setDomain(url.hostname);
      setCurrentTab(currentTab);
    });
  }, []);

  const onButtonClick = () => {
    if (!userName) {
      setIsNameError(true);
      return;
    }

    if (!isCreateChannel && !channelName) {
      setIsChannelError(true);
      return;
    }

    const data = {
      name: userName,
      domain,
      message: isCreateChannel ? 'CREATE_CHANNEL' : 'JOIN_CHANNEL',
    };

    if (!isCreateChannel) {
      data.channel = channelName;
    }

    chrome.runtime.sendMessage(data, (response) => {
      console.log('Response from background', response);
      const channel = response.channel;
      setChannelName(channel);
      setIsConnected(true);
      setIsConnecting(false);
    });

    setIsConnecting(true);
  };

  const onDisconnectButtonClick = () => {
    chrome.runtime.sendMessage({
      message: 'LEAVE_CHANNEL',
      channel: channelName,
      name: userName,
      domain,
    });
    setIsConnected(false);
    setUserName(null);
    setChannelName(null);
  };

  useEffect(() => {
    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage(
        { message: 'FETCH_SESSION_DATA', tab: currentTab },
        function (response) {
          if (response && response.data && response.data.user) {
            setIsConnected(true);
            setUserName(response.data.user);
            setChannelName(response.data.channel);
          }
        },
      );
    }
  }, [currentTab]);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const getLastQuery = () => {
    chrome.runtime.sendMessage(
      { message: 'GET_LAST_QUERY', channel: channelName, domain },
      function (response) {
        console.log('Last Query', response);
      },
    );
  };

  return (
    <>
      <div id="sp-panel-root">
        <h1>Story Pointer</h1>
        {isConnecting && <p>Connecting...</p>}
        {isConnected ? (
          <>
            <p className="connected">
              Connected to channel <strong>{channelName}</strong> as{' '}
              <strong>{userName}</strong>
            </p>
            <button onClick={onDisconnectButtonClick}>Disconnect</button>
            <div className={showDropdown ? 'more-btn show' : 'more-btn'}>
              <button onClick={toggleDropdown}>
                More <span> ^ </span>
              </button>
              <ul>
                <li onClick={getLastQuery}>
                  <span>Get last Query</span>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <fieldset>
              <legend>
                {isCreateChannel ? Labels.CREATE_CHANNEL : Labels.JOIN_CHANNEL}
              </legend>
              <section className="name">
                <input
                  type="text"
                  id="name"
                  placeholder="Enter your name"
                  onChange={(name) => setUserName(name.target.value)}
                />
                {isNameError && <small className="error">Please enter your name</small>}
              </section>
              {!isCreateChannel && (
                <section className="channel">
                  <input
                    type="text"
                    id="channel_name"
                    placeholder="Channel name"
                    onChange={(channel) => setChannelName(channel.target.value)}
                  />
                  {isChannelError && (
                    <small className="error">Please enter channel name</small>
                  )}
                </section>
              )}

              <button className="join_channel" onClick={onButtonClick}>
                {isCreateChannel ? Labels.CREATE_CHANNEL : Labels.JOIN_CHANNEL}
              </button>
            </fieldset>
            <a
              href="#"
              className="link-section-next"
              onClick={() => setIsCreateChannel(!isCreateChannel)}
            >
              {isCreateChannel ? Labels.JOIN_CHANNEL : Labels.CREATE_CHANNEL}
            </a>
          </>
        )}
      </div>
    </>
  );
}

export default PopupRoot;
