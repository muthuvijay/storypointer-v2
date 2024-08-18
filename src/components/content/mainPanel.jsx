import React, { useEffect } from "react";
import ParticipantsPanel from "./particpantPanel";
import Prompt from "./Prompt";
import ConfirmPrompt from "./ConfirmPrompt";
import VotePrompt from "./VotePrompt";
import "./mainPanel.scss";

const STORAGE_KEY = {
  CHANNEL: "CHANNEL",
  USER: "USER",
  PARTICIPANTS: "PARTICIPANTS",
};

export default function MainPanel() {
  const [participants, setParticipants] = React.useState([]);
  const [question, setQuestion] = React.useState("");
  const [isQuestionSelected, setIsQuestionSelected] = React.useState(false);
  const [isQuestionConfirmed, setIsQuestionConfirmed] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);

  const closeModal = () => {
    setShowModal(false);
    setIsQuestionSelected(false);
    setQuestion("");
  };

  const yesClickedModalCallback = () => {
    setShowModal(false);
    setIsQuestionSelected(false);
    // Send a message to the background script
    chrome.runtime.sendMessage({
      message: "QUESTION_CONFIRMED",
      question: question,
      channel: sessionStorage.getItem(STORAGE_KEY.CHANNEL),
    });
  };

  const onVoteModalCallback = (vote) => {
    setShowModal(false);
    setIsQuestionConfirmed(false);
    // Send a message to the background script
    if (vote) {
      console.log(`Voted for ${question} with ${vote}`);
      chrome.runtime.sendMessage({
        message: "VOTED_FOR_QUESTION",
        channel: sessionStorage.getItem(STORAGE_KEY.CHANNEL),
        user: sessionStorage.getItem(STORAGE_KEY.USER),
        question,
        value: vote,
      });
    }
  };

  /* useEffect(() => {
    const participantsFromStorage = sessionStorage.getItem(
      STORAGE_KEY.PARTICIPANTS
    );
    if (participantsFromStorage) {
      const storedParticipants = JSON.parse(participantsFromStorage);
      console.log("Stored participants", storedParticipants);
      if (storedParticipants.length > 0) {
        setParticipants(storedParticipants);
      }
    }
  }, [participants]); */

  useEffect(() => {
    function MessageListener(request, sender, sendResponse) {
      console.log("Message received in content script:", request);

      if (request.message === "ADD_PARTICIPANTS") {
        const participantsList = request.participants;
        // frameParticipantsPanel(participantsList);
        console.log("Participants", participantsList);
        sessionStorage.setItem(
          STORAGE_KEY.PARTICIPANTS,
          JSON.stringify(participantsList)
        );
        const particpantsMap = participantsList.map((name) => {
          return { user: name, value: "?" };
        });

        setParticipants(particpantsMap);
      }

      if (request.message === "ADD_SESSION_DATA") {
        console.log(request.channel, request.name);
        sessionStorage.setItem(STORAGE_KEY.CHANNEL, request.channel);
        sessionStorage.setItem(STORAGE_KEY.USER, request.name);
      }

      if (request.message === "SELECT_QUESTION") {
        console.log("Questions", request.question);
        setShowModal(true);
        setQuestion(request.question);
        setIsQuestionSelected(true);
        /* const confirmed = confirm(`Do you want to ask: ${request.question}?`);
        if (confirmed) {
          // Send a message to the background script
          chrome.runtime.sendMessage({
            message: "QUESTION_CONFIRMED",
            question: request.question,
            channel: sessionStorage.getItem(STORAGE_KEY.CHANNEL),
          });
        } */
      }

      if (request.message === "VOTE_QUESTION") {
        const question = request.question;
        setShowModal(true);
        setQuestion(question);
        setIsQuestionConfirmed(true);
        /* const vote = prompt(
          `What's your vote for : ${question} ? (1,2,3,5,8)`
        );
        if (vote) {
          chrome.runtime.sendMessage({
            message: "VOTED_FOR_QUESTION",
            channel: sessionStorage.getItem(STORAGE_KEY.CHANNEL),
            user: sessionStorage.getItem(STORAGE_KEY.USER),
            question,
            value: vote,
          });
        } */
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
        /* if (userVotes.length === participants.length) {
          userVotes.forEach((data) => {
            participantsList.push({ name: data.user, value: data.value });
            // participants.set(channel, { name: data.user, value: data.value });
            console.log(`User: ${data.user} voted for ${data.value}`);
          });
          showResultsPanel(question, participantsList);
        } else {
          console.log("Participants not voted yet", userVotes);
        } */
        setParticipants(userVotes);
      }

      if (request.message === "GET_SESSION_DATA") {
        // preload any participants data if present
        const participantsFromStorage = sessionStorage.getItem(
          STORAGE_KEY.PARTICIPANTS
        );
        if (participantsFromStorage) {
          const storedParticipants = JSON.parse(participantsFromStorage);
          console.log("Stored participants", storedParticipants);
          if (storedParticipants.length > 0) {
            // setParticipants(storedParticipants);
            const particpantsMap = storedParticipants.map((name) => {
              return { user: name, value: "?" };
            });

            setParticipants(particpantsMap);
          }
        }

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
    }

    if (chrome && chrome.runtime) {
      chrome.runtime.onMessage.addListener(MessageListener);
    }

    return () => {
      if (chrome && chrome.runtime) {
        chrome.runtime.onMessage.removeListener(MessageListener);
      }
    };
  }, []);

  return (
    <>
      {participants.length > 0 && (
        <ParticipantsPanel participants={participants} />
      )}
      {question && isQuestionConfirmed && (
        <Prompt showModal={showModal} closeModal={closeModal}>
          <VotePrompt question={question} onVoteCB={onVoteModalCallback} />
        </Prompt>
      )}
      {isQuestionSelected && (
        <Prompt
          question={question}
          showModal={showModal}
          closeModal={closeModal}
        >
          <ConfirmPrompt
            closeModal={closeModal}
            question={question}
            yesModal={yesClickedModalCallback}
          />
        </Prompt>
      )}
    </>
  );
}
