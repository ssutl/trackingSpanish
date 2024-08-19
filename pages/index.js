import React from 'react';

export default function Home() {

  const handleSignIn = async () => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { message: "sign_in" }, async (response) => {
        console.log(response);
      });
    });

    // Send a message to background script
  };


  return (
    <div>
     <h1 onClick={()=>handleSignIn()}>Sign Baby</h1>
    </div>
  );
}
