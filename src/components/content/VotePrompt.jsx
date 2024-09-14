import React from 'react';

export default function VotePrompt({ question, onVoteCB, closeModal }) {
  const onVoteCallback = () => {
    const vote = document.querySelector("input[name='vote']").value;
    onVoteCB(vote);
  };
  return (
    <div className="vote-prompt">
      <h2>Vote</h2>
      <section>
        <p>
          Please add your point for this question: <strong>{`${question}`}</strong>
        </p>
        <input type="number" name="vote" autoFocus />
        <p>
          <small>Hint: 1,2,3,5,8,..,99</small>
        </p>
      </section>
      <div className="__buttons">
        <button onClick={onVoteCallback}>Vote it</button>
        <button onClick={closeModal}>Cancel</button>
      </div>
    </div>
  );
}
