// Save the API key to Chrome's local storage
function saveOptions(e) {
    e.preventDefault();
    chrome.storage.local.set({
        prompt_instructions: document.getElementById('prompt_instructions').value,
        apiUrl: document.getElementById('apiUrl').value,
        hide_threshold: document.getElementById('hide_threshold').value,
        prompt_template: document.getElementById('prompt_template').value
    });
}

// Load the API key and URL from Chrome's local storage
function restoreOptions() {
    chrome.storage.local.get(['prompt_instructions', 'apiUrl', 'hide_threshold', 'prompt_template'], (res) => {
        document.getElementById('apiUrl').value = res.apiUrl || '';
        document.getElementById('prompt_instructions').value = res.prompt_instructions || '';
        document.getElementById('hide_threshold').value = res.hide_threshold || '';
        document.getElementById('prompt_template').value = res.prompt_template || '';
    });
}


document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('optionsForm').addEventListener('submit', saveOptions);
