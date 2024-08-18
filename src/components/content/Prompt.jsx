import React from "react";
import "./prompt.scss";

export default function Prompt({ children, showModal }) {
  return (
    <>
      {showModal && (
        <section id='storybot-prompt'>
          <div className='overlay'></div>
          <div className='prompt-panel'>{children}</div>
        </section>
      )}
    </>
  );
}
