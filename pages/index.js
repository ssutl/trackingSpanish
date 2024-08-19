import React from 'react';

export default function Home() {

  const handleSignIn = async () => {
    // send message to background.js
    chrome.runtime.sendMessage({message:"sign_in"});
  };


  return (
    <div>
      <button onClick={(e)=>{
        e.preventDefault();
        handleSignIn();
      }}>Sign In</button>
    </div>
  );
}
