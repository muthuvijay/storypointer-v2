import React from "react";

export default function VotePrompt({ question, onVoteCB }) {
  const onVoteCallback = () => {
    const vote = document.querySelector("input[name='vote']").value;
    onVoteCB(vote);
  };
  return (
    <div className='vote-prompt'>
      <h2>Vote</h2>
      <section>
        <p>{`What's your vote for : ${question} ? (1,2,3,5,8)`}</p>
        <input type='number' name='vote' />
      </section>
      <button onClick={onVoteCallback}>Vote it</button>
    </div>
  );
}
