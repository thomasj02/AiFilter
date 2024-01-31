const {LRUCache} = require('lru-cache');
import {OpenAI} from 'openai';

const lru_options = {
    max: 500,
}

const tweet_cache = new LRUCache(lru_options); // Initialize the cache
console.log("Cache size:", tweet_cache.size);

function getOptionValue(option_name) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(option_name, (result) => {
            if(chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(String(result[option_name]));
        });
    });
}

function createMessageFromTemplate(template, prompt_instruction, tweet) {
    let retval = template.replace('{tweet}', tweet);
    retval = retval.replace('{prompt_instructions}', prompt_instruction);
    return retval;
}

function calculateProbs(log_probs) {
    const yes_logprobs = [];
    const no_logprobs = [];

    for(const [token, lp] of Object.entries(log_probs.top_logprobs[0])) {
        if(token.toUpperCase() === "YES" || token.toUpperCase() === "Y") {
            yes_logprobs.push(lp);
        } else if(token.toUpperCase() === "NO" || token.toUpperCase() === "N") {
            no_logprobs.push(lp);
        }
    }

    const total_yes_prob = yes_logprobs.reduce((acc, logprob) => acc + Math.exp(logprob), 0);
    const total_no_prob = no_logprobs.reduce((acc, logprob) => acc + Math.exp(logprob), 0);

    const yes_prob = total_yes_prob / (total_yes_prob + total_no_prob);
    const no_prob = total_no_prob / (total_yes_prob + total_no_prob);

    return {log_probs, yes_prob, no_prob};
}

// Function to decide whether to hide a tweet
async function shouldHideTweet(llm_config, tweet_text) {
    if(tweet_cache.has(tweet_text)) {
        return tweet_cache.get(tweet_text);
    }

    const tweetPromise = (async () => {
        try {
            const prompt = createMessageFromTemplate(
                llm_config.prompt_template, llm_config.prompt_instructions, tweet_text);

            const request = {
                model: llm_config.model.id,
                prompt: prompt,
                max_tokens: 1,
                logprobs: 10,
                stream: false,
            };

            const response = await llm_config.openai_client.completions.create(request);

            const log_probs = response.choices[0].logprobs;
            const {yes_prob, no_prob} = calculateProbs(log_probs);
            const result = no_prob > llm_config.hide_threshold;
            if(result) {
                console.log('Hiding tweet:', tweet_text, 'yes_prob:', yes_prob, 'no_prob:', no_prob);
            }
            return result;
        } catch(error) {
            console.error('Error:', error);
            return false;
        }
    })();

    tweet_cache.set(tweet_text, tweetPromise);
    return tweetPromise;
}

// Function to process and hide tweets
async function processTweets(llm_config) {
    const tweetSelector = 'div[data-testid="tweetText"]';
    for(const tweet of document.querySelectorAll(tweetSelector)) {
        const tweet_text = tweet.textContent;
        if(await shouldHideTweet(llm_config, tweet_text)) {
            const article = tweet.closest('article');
            if(article) {
                article.style.display = 'none';
            }
        }
    }
}


// Call the function initially to hide existing tweets
processTweets().then(() => {
    console.log('Done hiding existing tweets');
});

async function initializeClient() {
    try {
        const api_url = await getOptionValue('apiUrl');
        console.log('Using API URL:', api_url);
        const client = new OpenAI({
            baseURL: api_url, apiKey: "NONE", dangerouslyAllowBrowser: true
        });

        const models = await client.models.list();
        const model = models.data[0];
        console.log('Using model:', model);

        const prompt_template = await getOptionValue('prompt_template');
        console.log('Using prompt template:', prompt_template);

        const prompt_instructions = await getOptionValue('prompt_instructions')
        console.log('Using prompt instructions:', prompt_instructions);

        const hide_threshold_str = await getOptionValue('hide_threshold');
        console.log('Got hide threshold str:', hide_threshold_str);

        const hide_threshold = parseFloat(hide_threshold_str);
        console.log('Using hide threshold:', hide_threshold);

        return {
            openai_client: client,
            model: model,
            prompt_template: prompt_template,
            prompt_instructions: prompt_instructions,
            hide_threshold: hide_threshold
        };
    } catch(error) {
        console.error('Error:', error);
        throw error;
    }
}

// Initialize the client and then set up the observer
initializeClient().then(llm_config => {
    // Call processTweets initially to hide existing tweets
    processTweets(llm_config).then(() => {
        console.log('Done hiding existing tweets');
    });
    // Use MutationObserver to watch for changes in the DOM
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if(mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                processTweets(llm_config)
                    .then(() => {
                        console.log('Done hiding new tweets');
                    });
            }
        });
    });

    // Start observing the DOM for changes
    const config = {childList: true, subtree: true};
    const targetNode = document.body; // Adjust this to the specific container
    observer.observe(targetNode, config);
}).catch(error => {
    console.error('Error initializing client:', error);
});
