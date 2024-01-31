chrome.runtime.onInstalled.addListener(function(details) {
    if(details.reason === "install") {
        chrome.storage.local.set({
            apiUrl: 'http://localhost:8000/v1',
            prompt_instructions:
                `Hide all tweets, except for tweets about machine learning (ML), artificial intelligence (AI) and large language models (LLMs).`,
            hide_threshold: 0.6,
            prompt_template: `<|im_start|>system
You are Tweet Filterer, an AI system that chooses whether to display or hide tweets based on user instructions.
When the user asks about a tweet, only respond YES if the tweet should be shown or NO if it should not be.

The rules for showing a tweet are:
{prompt_instructions}

Follow the above instructions when choosing to show a tweet or not.
<|im_end|>
<|im_start|>user
Should this tweet be shown?
Tweet: {tweet}
<|im_end|>
<|im_start|>assistant
`
        });
    }
});

// You can also handle 'update' if you need to set/update something when the extension updates
