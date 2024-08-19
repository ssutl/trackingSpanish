import React from 'react';

export default function Home() {

  const handleSignIn = async () => {
    // chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    //   chrome.tabs.sendMessage(tabs[0].id, { message: "sign_in" }, async (response) => {
    //     console.log(response);
    //   });
    // });

    //send message to background.js
    chrome.runtime.sendMessage({message:"sign_in"});
  };


  return (
    <div>
     <h1 onClick={()=>handleSignIn()}>Sign In Baby</h1>
    </div>
  );
}
