// IntroModal.jsx
import React, { useState } from "react";
import "../../styles/intromodal.css"; // We'll put CSS here
import TypingText from "../../component/shared/TypingText";
import { color } from "framer-motion";

const prompts = [
  "Welcome to VerseMate! I am here to help you quickly find and listen to verses exclusively from the King James Version (KJV) of the Bible.",
  "I read one verse at a time. If you speak a text spanning multiple verses, the result may be approximate.",
  "If your voice input is not recognized or an error occurs, try turning the microphone off and on again.",
  "If the issue persists after rebooting the mic, please reload the page or app.",
  "Try speaking continuously, without pausing for more than 2 seconds, to ensure accurate recognition.",
  "The microphone does not listen while content is loading. Please wait for the assistant to finish processing before speaking.",
  "Remember, you can ask for specific chapters, verses, or simply speak your heart, and I’ll try to find the most relevant scripture for you."
];

export default function IntroModal({ onComplete }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState("next"); // track animation direction

  const handleNext = () => {
    setDirection("next");
    if (step < prompts.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    setDirection("prev");
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const textstyle={
    color:"rgba(39, 39, 39, 1)",
    fontSize: ".9rem",
    marginLeft: "1rem"
}

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className={`modal-content slide-${direction}`} key={step}>
<div className="flex items-start gap-3">
  <span className="modal-dot"></span>

  <TypingText
    text={prompts[step]}
    speed={30}
    style={textstyle}
  />
</div>


            <div className="modal-buttons">
            {step > 0 && (
              <button className="btn" onClick={handlePrev}>
                Previous
              </button>
            )}
            <button className="btn" onClick={handleNext}>
              {step < prompts.length - 1 ? "Next" : "Got it!"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
