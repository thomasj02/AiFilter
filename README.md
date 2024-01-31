# AI Filter

Project status: Proof of concept  

## What is this?

AI Filter is a Chrome extension that uses a local language model to filter your
social media feeds (currently, only Twitter / X) according
to your instructions. For instance, you can say:

> Hide all tweets, except for tweets about machine learning (ML), artificial intelligence (AI) and large language models (LLMs).

or:

> 1. By default, show all tweets
> 2. Do not show any tweets related to cryptocurrencies, blockchain, Bitcoin, Ethereum or related projects.

AI Filter will follow your instructions, hiding the
appropriate tweets in the background as you browse Twitter.

Note that because it is a Chrome extension, it only works in the browser,
not with the Twitter / X app on your phone or other device.

[Video demo](Video demo: https://www.youtube.com/watch?v=CligVVTC5io)

## Getting Started

This project is in the proof of concept stage, which means that it
requires some technical know-how to get started. 

1. Install vLLM using these [instructions](https://docs.vllm.ai/en/latest/getting_started/installation.html). Note that a
CUDA (Nvidia) GPU is required.  
2. Download a language model. AI Filter has been tested with
   [Nous Hermes 2 - Solar 10.7B](https://huggingface.co/NousResearch/Nous-Hermes-2-SOLAR-10.7B) but you
can try other models. NH2S 10.7B just barely fits on a 24G GPU. Note that if you use another model, you  ***must*** 
edit the prompt template (see below). 
3. Start vLLM (see sample command line below)
4. Download the extension from the [releases page](https://github.com/thomasj02/AiFilter/releases) and decompress it
5. Go to [chrome://extensions/](chrome://extensions/) and enable developer mode
6. Choose "Load unpacked" and select the directory containing AI Filter
7. Click on the extension in Chrome's toolbar and navigate to the options page to edit the instructions, vLLM server URL, and other options
8. You're all set! Visit X.com and AI Filter should automatically hide the tweets you told it to.


#### Tips for getting started:

* Like all LLMs, AI Filter is not perfect. It will sometimes hide tweets that you want to see, and sometimes show tweets
that you want to hide. If you're not getting the results you want, try tweaking your instructions or try out different models.
* If you change options (instructions, prompt, etc.) you will need to reload X for the new settings to take effect. 
* You can use this example command to start vLLM (see vLLM docs for [details of what the flags do](https://docs.vllm.ai/en/latest/models/engine_args.html)): `python -m vllm.entrypoints.openai.api_server --gpu-memory-utilization 0.99 --max-model-len 4096 --enforce-eager --model /path/to/Nous-Hermes-2-SOLAR-10.7B --swap-space 32`
* If you use a different model, you need to change the prompt template in the extension settings.
The LLM model card on Huggingface should give an example of what prompt template to use. When setting the prompt template,
`{tweet}` will be replaced with the contents of the tweet to evaluate, and `{prompt_instructions}` will be replaced with your
instructions.
* You may be able to use GGUF quantized models if you're willing to do a little hacking. See [this issue](https://github.com/vllm-project/vllm/issues/1002)
for the current status of GGUF support in vLLM.
* The extension logs quite a bit of diagnostic info to the browser console. If something
isn't working the way you expect, you can check these logs for information on what might be going wrong.
If you still can't figure it out, add more logging in `resources/content.js` and rebuild from source (see below).

### Building from source

AI Filter is an open source project, so you can play with the source code 
and experiment as you like. To build the project:
* Clone the repository
* Navigate to the chrome_extension directory
* Using npm, install all dependencies
* Run `npx parcel build resources/content.js`
* Load the extension from the resulting `bundled/` directory

## How does this thing work?

Most of the time when we use LLMs like ChatGPT, we want them to generate text in response to some input
prompt. AI Filter works in a similar way, but it builds a prompt that tells the LLM to follow the user's
instructions, and then only output one token: YES if the tweet should be displayed, or NO if it shouldn't.

Because LLMs have some randomness in their output, AI Filter directly calculates the probability that the LLM outputs
YES or NO, and then uses the NO probability to choose whether to hide tweets. The specific cutoff probability for hiding
can be adjusted in the extension's options page. 


## Social FAQ

* Why did you build this?

A lot of people are thinking about what it means to have unaligned AI and how that might harm humanity in the future.
Most of these concerns are fanciful stories about "paperclip maximizers" or biological weapons development. 
These stories detract from the most harmful AI systems that are present today: **Social media recommendation engines.**
Social media recommendation engines optimize for engagement, which often means content that enrages us, 
makes fun of our out-group, or presents a clever meme instead of thoughtful discussion.

AI Filter is a way to fight AI with AI: It gives the user the ability to take back some control from 
recommendation engines and choose for themselves what they want to see or not see.

* Won't this just lead to more "social bubbles" where people only see content that they already agree with?

Yes, probably. If you use this extension on a regular basis, you may want to consider occasionally inverting
the filter's instructions by hiding what you normally see and showing what you normally hide.

* How can I help?

**Engineers**: Submit PRs! There are lots of improvements possible, like improving the UI, adding support for HuggingFace inference, 
adding support for other social networks, and cleaning up the code. 

**Local LLM users**: Try different models and prompts, and share the results!

**Other supporters**: Share the project on your favorite social network!

## Technical FAQ

* How do I download a language model?

Navigate to the language model's page on HuggingFace, then choose "Files and Versions". Click the three dots button
next to "Train" and choose "Clone repository". Follow the instructions displayed by HuggingFace.

* Why use vLLM instead of llama.cpp's server?

vLLM provides continuous batching, access to token log probabilities, an OpenAI compatible API, and is easy to install.
llama.cpp provides an OpenAI compatible server, but it currently doesn't expose logprobs, doesn't support
advanced features like continuous batching, and requires a more complicated build process. 

* Can I just use OpenAI's endpoint instead of a local LLM?

Yes, you could point the extension to the real OpenAI API, but back of the envelope calculates indicate that it would cost somewhere around $0.02 just to load 
the Twitter.com home page, and the cost would grow as more tweets were processed. You could easily spend $5 or more just
casually scrolling through Twitter, which seems excessive. 

* A 10.7B model is too big for me to run, what can I do?

I haven't tested other models, but I suspect a high quality small model like
Phi-2 might work almost as well. You can also try a quantized model, but see the vLLM issue
above regarding support for GGUF models. 
