import React from "react";
import "./panel.scss";

export default function ParticipantsPanel({ participants }) {
  console.log("ParticipantsPanel -> participants", participants);
  return (
    <section id='storybot-participants-panel'>
      <h2>Participants</h2>
      <ul>
        {participants.map((participant, index) => (
          <li key={index}>
            <span>{participant.value}</span>
            <span>{participant.user}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
