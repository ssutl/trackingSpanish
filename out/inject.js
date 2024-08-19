console.log("Message from inject.js")
//Fromhere I can fuck with the whole UI in the future if i want

chrome.runtime.onMessage.addListener((request) => {
  if (request.message === "sign_in") {
    console.log("Sign In Request")
    chrome.runtime.sendMessage({ message: ""}, (response) => {
      console.log(response);
    });
  }
});

