import React from "react";

export default function ConfirmPrompt({ closeModal, question, yesModal }) {
  return (
    <div className='confirm-prompt'>
      <h2>Confirm</h2>
      <section>
        <p>Do you want to ask this question?</p>
        <strong>{`${question}`}</strong>
      </section>
      <div className='__buttons'>
        <button onClick={yesModal}>Yes</button>
        <button onClick={closeModal}>No</button>
      </div>
    </div>
  );
}
