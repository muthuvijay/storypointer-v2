import { useEffect, useState } from "react";
import "./popup.scss";

function PopupRoot() {
  const [userName, setUserName] = useState(null);
  const [channelName, setChannelName] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  console.log(isConnected, userName, channelName);
  const onButtonClick = () => {
    chrome.runtime.sendMessage({
      name: userName,
      channel: channelName,
      message: "JOIN_CHANNEL",
    });
    setIsConnected(true);
  };

  const onDisconnectButtonClick = () => {
    chrome.runtime.sendMessage({
      message: "LEAVE_CHANNEL",
    });
    setIsConnected(false);
    setUserName(null);
    setChannelName(null);
  };

  useEffect(() => {
    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage(
        { message: "FETCH_SESSION_DATA" },
        function (response) {
          if (response && response.data && response.data.user) {
            setIsConnected(true);
            setUserName(response.data.user);
            setChannelName(response.data.channel);
          }
        }
      );
    }
  }, []);

  return (
    <>
      <div id='sp-panel-root'>
        <h1>Story Pointer</h1>
        {isConnected ? (
          <>
            <p>
              Connected to channel {channelName} as {userName}
            </p>
            <button onClick={onDisconnectButtonClick}>Disconnect</button>
          </>
        ) : (
          <fieldset>
            <legend>Join Channel</legend>
            <section className='name'>
              <input
                type='text'
                id='name'
                placeholder='Enter your name'
                onChange={(name) => setUserName(name.target.value)}
              />
            </section>
            <section className='channel'>
              <input
                type='text'
                id='channel_name'
                placeholder='Channel name'
                onChange={(channel) => setChannelName(channel.target.value)}
              />
            </section>
            <button className='join_channel' onClick={onButtonClick}>
              Create or Join Channel
            </button>
          </fieldset>
        )}
      </div>
    </>
  );
}

export default PopupRoot;
