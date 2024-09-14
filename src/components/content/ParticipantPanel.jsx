import React from "react";
import "./panel.scss";

export default function ParticipantsPanel({ participants }) {
  console.log("ParticipantsPanel -> participants", participants);
  const [showParticipants, setShowParticipants] = React.useState(true);

  const toggleParticipants = () => {
    setShowParticipants(!showParticipants);
  }

  const icon = chrome.runtime.getURL("./images/icon48.png");

  return (
    <>
      {
        !showParticipants && (
          <div className="participants-icon">
            <span onClick={toggleParticipants}>
              <img src={icon} alt="icon" />
            </span>
          </div>
        )
      }
      
      {showParticipants && (
        <section id='storybot-participants-panel'>
          <div className="participants-header">
            <h2>Participants</h2>
            <span onClick={toggleParticipants}> X </span>
          </div>
          <ul>
            {participants.map((participant, index) => (
              <li key={index}>
                <span className="circle">{participant.vote}</span>
                <span>{participant.user}</span>
              </li>
            ))}
          </ul>
        </section>
        )
      }
      
      </>
  );
}
