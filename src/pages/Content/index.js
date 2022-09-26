const { convert } = require('html-to-text');

function getSelectionText() {
  var text = '';
  if (window.getSelection) {
    text = window.getSelection().toString();
  } else if (document.selection && document.selection.type != 'Control') {
    text = document.selection.createRange().text;
  }
  return text;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message === 'queryPageText') {
    console.log("rec'd message to query page");
    let bodyHTML = document.querySelector('[role="main"]');
    let allText = convert(bodyHTML.innerHTML);
    let position1 = allText.search('to');
    let position2 = allText.search('Reply');
    allText = allText.substring(position1, position2);
    sendResponse({ text: allText });
  } else if (request.message === 'queryHighlightedText') {
    console.log("rec'd message to highlight page");
    let allText = getSelectionText();
    sendResponse({ text: allText });
  }
});
