import React, { useEffect } from 'react';
import ParticipantsPanel from './ParticipantPanel';
import Prompt from './Prompt';
import ConfirmPrompt from './ConfirmPrompt';
import VotePrompt from './VotePrompt';
import './MainPanel.scss';

const STORAGE_KEY = {
  CHANNEL: 'CHANNEL',
  USER: 'USER',
  PARTICIPANTS: 'PARTICIPANTS',
  LAST_QUESTION: 'LAST_QUESTION',
  QUESTION_VOTES: 'QUESTION_VOTES',
};

export default function MainPanel() {
  const [participants, setParticipants] = React.useState([]);
  const [question, setQuestion] = React.useState('');
  const [isQuestionSelected, setIsQuestionSelected] = React.useState(false);
  const [isQuestionConfirmed, setIsQuestionConfirmed] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);

  const closeModal = () => {
    setShowModal(false);
    setIsQuestionSelected(false);
    setQuestion('');
  };

  const yesClickedModalCallback = () => {
    setShowModal(false);
    setIsQuestionSelected(false);
    // Send a message to the background script
    chrome.runtime.sendMessage({
      message: 'QUESTION_CONFIRMED',
      question: question,
      channel: sessionStorage.getItem(STORAGE_KEY.CHANNEL),
      domain: location.hostname,
    });
  };

  const onVoteModalCallback = (vote) => {
    setShowModal(false);
    setIsQuestionConfirmed(false);
    // Send a message to the background script
    if (vote) {
      console.log(`Voted for ${question} with ${vote}`);
      chrome.runtime.sendMessage({
        message: 'VOTED_FOR_QUESTION',
        channel: sessionStorage.getItem(STORAGE_KEY.CHANNEL),
        user: sessionStorage.getItem(STORAGE_KEY.USER),
        question,
        value: vote,
        domain: location.hostname,
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

  function addParticipants(request) {
    const participantsList = request.participants;
    // frameParticipantsPanel(participantsList);
    console.log('Participants', participantsList);
    sessionStorage.setItem(STORAGE_KEY.PARTICIPANTS, JSON.stringify(participantsList));
    const particpantsMap = participantsList.map((name) => {
      return { user: name, vote: '?' };
    });

    setParticipants(particpantsMap);
  }

  useEffect(() => {
    function MessageListener(request, sender, sendResponse) {
      console.log('Message received in content script:', request);

      if (request.message === 'ADD_PARTICIPANTS') {
        addParticipants(request);
      }

      // Notified once the participant leave the channel, update for remaining participants
      if (request.message === 'PARTICIPANTS_REMAIN') {
        // update only if the session storage exists
        if (
          sessionStorage.getItem(STORAGE_KEY.CHANNEL) &&
          sessionStorage.getItem(STORAGE_KEY.USER)
        ) {
          addParticipants(request);
        }
      }

      if (request.message === 'ADD_SESSION_DATA') {
        console.log(request.channel, request.name);
        if (request.channel && request.name) {
          sessionStorage.setItem(STORAGE_KEY.CHANNEL, request.channel);
          sessionStorage.setItem(STORAGE_KEY.USER, request.name);
        }
      }

      if (request.message === 'SELECT_QUESTION') {
        console.log('Questions', request.question);
        if (
          sessionStorage.getItem(STORAGE_KEY.CHANNEL) &&
          sessionStorage.getItem(STORAGE_KEY.USER)
        ) {
          setShowModal(true);
          setQuestion(request.question);
          setIsQuestionSelected(true);
        } else {
          console.log('Question cant be asked as channel or user not set');
        }
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

      if (request.message === 'VOTE_QUESTION') {
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

      if (request.message === 'REVEAL_VOTES') {
        const question = request.question;
        const userVotes = request.votes;
        // const channel = sessionStorage.getItem(STORAGE_KEY.CHANNEL);
        const participantsList = [];
        const participants = JSON.parse(sessionStorage.getItem(STORAGE_KEY.PARTICIPANTS));
        console.log('Participants', participants.length, userVotes.length);

        //store votes in the storage
        sessionStorage.setItem(STORAGE_KEY.LAST_QUESTION, question);
        const lastQuestionVotes = new Map();
        lastQuestionVotes.set(question, userVotes);
        sessionStorage.setItem(
          STORAGE_KEY.QUESTION_VOTES,
          JSON.stringify(Array.from(lastQuestionVotes.entries())),
        );

        participants.forEach((participant) => {
          const data = userVotes.find((vote) => vote.user === participant);
          participantsList.push({ user: participant, vote: data ? data.vote : '?' });
        });

        setParticipants(participantsList);
      }

      if (request.message === 'GET_SESSION_DATA') {
        // preload any participants data if present
        const participantsFromStorage = sessionStorage.getItem(STORAGE_KEY.PARTICIPANTS);

        // Retain the votes for the last question when the user clicks on the extension icon
        const lastQuestionVotes = sessionStorage.getItem(`QUESTION_VOTES`);
        const lastQuestion = sessionStorage.getItem(`LAST_QUESTION`);
        let participantsMap = [];
        if (participantsFromStorage) {
          const storedParticipants = JSON.parse(participantsFromStorage);
          console.log('Stored participants', storedParticipants);
          if (storedParticipants.length > 0) {
            if (lastQuestionVotes && lastQuestion) {
              const lastQuestionVotesMap = new Map(JSON.parse(lastQuestionVotes));
              const lastQuestionVotesArray = lastQuestionVotesMap.get(lastQuestion);

              participantsMap = storedParticipants.map((name, i) => {
                let vote = '?';
                if (Array.isArray(lastQuestionVotesArray)) {
                  const user = lastQuestionVotesArray.find((data) => data.user === name);
                  if (user) {
                    vote = user.vote;
                  }
                }

                return {
                  user: name,
                  vote: vote,
                };
              });
            } else {
              participantsMap = storedParticipants.map((name) => {
                return { user: name, vote: '?' };
              });
            }

            setParticipants(participantsMap);
          }
        }

        sendResponse({
          data: {
            user: sessionStorage.getItem(STORAGE_KEY.USER),
            channel: sessionStorage.getItem(STORAGE_KEY.CHANNEL),
            domain: location.hostname,
          },
        });
      }

      if (request.message === 'DELETE_SESSION_DATA') {
        sessionStorage.removeItem(STORAGE_KEY.CHANNEL);
        sessionStorage.removeItem(STORAGE_KEY.USER);
        sessionStorage.removeItem(STORAGE_KEY.PARTICIPANTS);
        sessionStorage.removeItem(STORAGE_KEY.LAST_QUESTION);
        sessionStorage.removeItem(STORAGE_KEY.QUESTION_VOTES);
        setParticipants([]); //clear participants panel
      }

      if (request.message === 'GET_DATA') {
        sendResponse({
          user: sessionStorage.getItem(STORAGE_KEY.USER),
          channel: sessionStorage.getItem(STORAGE_KEY.CHANNEL),
        });
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
      {participants.length > 0 && <ParticipantsPanel participants={participants} />}
      {question && isQuestionConfirmed && (
        <Prompt showModal={showModal} closeModal={closeModal}>
          <VotePrompt
            question={question}
            onVoteCB={onVoteModalCallback}
            closeModal={closeModal}
          />
        </Prompt>
      )}
      {isQuestionSelected && (
        <Prompt question={question} showModal={showModal} closeModal={closeModal}>
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
