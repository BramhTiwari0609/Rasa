/*
Makes backend API call to rasa chatbot and display output to chatbot frontend
*/

function init() {

    //---------------------------- Including Jquery ------------------------------

    var script = document.createElement('script');
    script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js';
    script.type = 'text/javascript';
    document.getElementsByTagName('head')[0].appendChild(script);

    //--------------------------- Important Variables----------------------------
    botLogoPath = "./imgs/bot-logo.png"

    //--------------------------- Chatbot Frontend -------------------------------
    const chatContainer = document.getElementById("chat-container");

    template = `
    <button class='chat-btn'><img src = "./icons/comment.png" class = "icon" ></button>
    <div class='chat-popup'>
		<div class='chat-header'>
            <div class='chatbot-img'>
				<img src='${botLogoPath}' alt='Chat Bot image' class='bot-img'> 
			</div>
			<h3 class='bot-title'>iGnite Bot</h3>
			<button class = "expand-chat-window" ><img src = "./icons/close_fullscreen.png" class = 'icon'></button>
		</div>
        <div class="chat-body-container">
            <div class="bot-area">
                <div id="bot-3d"></div>
            </div>
            <div class="chat-body">
                <div class='chat-area'>
                    <div class='bot-msg'>
                        <span class='msg'>Hi, How can i help you?</span>
                    </div>
                </div>

                <div class='chat-input-area'>
                    <input type='text' id='result' autofocus class='chat-input' onkeypress='return givenUserInput(event)' placeholder='Type a message ...' autocomplete='off'>
                    <button class='chat-voice' onclick="startConverting();"><i class='material-icons'>mic</i></button>
                    <button class='chat-submit'><i class='material-icons'>send</i></button>
                </div>
            </div>
        </div>
    </div>`


    chatContainer.innerHTML = template;

    //--------------------------- Important Variables----------------------------
    var inactiveMessage = "Server is down, Please contact the developer to activate it"


    chatPopup = document.querySelector(".chat-popup")
    chatBtn = document.querySelector(".chat-btn")
    chatSubmit = document.querySelector(".chat-submit")
    chatHeader = document.querySelector(".chat-header")
    chatArea = document.querySelector(".chat-area")
    chatInput = document.querySelector(".chat-input")
    expandWindow = document.querySelector(".expand-chat-window")
    root = document.documentElement;
    chatPopup.style.display = "none"
    var host = ""

    botArea = document.querySelector(".bot-area")



    //------------------------ ChatBot Toggler -------------------------



    // chatVoice.addEventListener('click',()=>{
    //     fetch('http://localhost:5005/webhooks/rest/webhook')
    //     startRecording.bind(this)

    // })

    chatBtn.addEventListener("click", () => {
        mobileDevice = !detectMob()
        if (chatPopup.style.display == "none" && mobileDevice) {
            chatPopup.style.display = "flex"
            chatInput.focus();
            chatBtn.innerHTML = `<img src = "./icons/close.png" class = "icon" >`
            botArea.style.display = 'flex'
            threeAPI.play('#bot-3d')
            // threeAPI.actions('playEmote', 'Wave')
        } else if (mobileDevice) {
            chatPopup.style.display = "none"
            chatBtn.innerHTML = `<img src = "./icons/comment.png" class = "icon" >`
        } else {
            botArea.style.display = 'none'
            mobileView()
        }
    })

    chatSubmit.addEventListener("click", () => {
        let userResponse = chatInput.value.trim();
        if (userResponse !== "") {
            setUserResponse();
            send(userResponse)
        }
    })

    expandWindow.addEventListener("click", (e) => {
        // console.log(expandWindow.innerHTML)
        if (expandWindow.innerHTML == '<img src="./icons/open_fullscreen.png" class="icon">') {
            expandWindow.innerHTML = `<img src = "./icons/close_fullscreen.png" class = 'icon'>`
            root.style.setProperty('--chat-window-height', 80 + "%");
            root.style.setProperty('--chat-window-total-width', 85 + "%");
            botArea.style.display = 'flex'
        } else if (expandWindow.innerHTML == '<img src="./icons/close.png" class="icon">') {
            chatPopup.style.display = "none"
            chatBtn.style.display = "block"
        } else {
            expandWindow.innerHTML = `<img src = "./icons/open_fullscreen.png" class = "icon" >`
            root.style.setProperty('--chat-window-height', 500 + "px");
            root.style.setProperty('--chat-window-total-width', 380 + "px");
            botArea.style.display = 'none'
        }

    })
}

// end of init function



var passwordInput = false;

function userResponseBtn(e) {
    send(e.value);
}

// to submit user input when he presses enter
function givenUserInput(e) {
    if (e.keyCode == 13) {
        let userResponse = chatInput.value.trim();
        if (userResponse !== "") {
            setUserResponse()
            send(userResponse)
        }
    }
}

// to display user message on UI
function setUserResponse() {
    let userInput = chatInput.value;
    if (passwordInput) {
        userInput = "******"
    }
    if (userInput) {
        let temp = `<div class="user-msg"><span class = "msg">${userInput}</span></div>`
        chatArea.innerHTML += temp;
        chatInput.value = ""
    } else {
        chatInput.disabled = false;
    }
    scrollToBottomOfResults();
}



function scrollToBottomOfResults() {
    chatArea.scrollTop = chatArea.scrollHeight;
}

/***************************************************************
Frontend Part Completed
****************************************************************/

host = 'http://localhost:5005/webhooks/rest/webhook'
function send(message) {
    chatInput.type = "text"
    passwordInput = false;
    chatInput.focus();
    console.log("User Message:", message)
    $.ajax({
        url: host,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            "message": message,
            "sender": "User"
        }),
        success: function (data, textStatus) {
            if (data != null) {
                $.ajax({
                    url: 'http://localhost:5005/conversations/User/tracker',
                    type: 'GET',
                    contentType: 'application/json',
                    success: function(resp) {
                        let intent = resp.latest_message.intent.name;
                        playEmote(intent)
                        setBotResponse(data);
                    }
                })
            }
            console.log("Rasa Response: ", data, "\n Status:", textStatus)
        },
        error: function (errorMessage) {
            setBotResponse("");
            console.log('Error' + errorMessage);

        }
    });
    chatInput.focus();
}


//------------------------------------ Set bot response -------------------------------------
function setBotResponse(val) {
    setTimeout(function () {
        if (val.length < 1) {
            //if there is no response from Rasa
            // msg = 'I couldn\'t get that. Let\' try something else!';
            msg = inactiveMessage;

            threeAPI.actions('changeState', 'Death')

            var BotResponse = `<div class='bot-msg'><span class='msg'> ${msg} </span></div>`;
            $(BotResponse).appendTo('.chat-area').hide().fadeIn(1000);
            scrollToBottomOfResults();
            chatInput.focus();

        } else {
            // threeAPI.actions('changeState', 'Idle')
            // threeAPI.actions('playRandomEmote')
            //if we get response from Rasa
            for (i = 0; i < val.length; i++) {
                //check if there is text message
                if (val[i].hasOwnProperty("text")) {
                    const botMsg = val[i].text;
                    if (botMsg.includes("password")) {
                        chatInput.type = "password";
                        passwordInput = true;
                    }

                    if ('speechSynthesis' in window) {
                        var msg = new SpeechSynthesisUtterance();
                        msg.text = val[i].text;
                        window.speechSynthesis.speak(msg);
                    }

                    var BotResponse = `<div class='bot-msg'><span class='msg'>${val[i].text}</span></div>`;
                    $(BotResponse).appendTo('.chat-area').hide().fadeIn(1000);
                }

                //check if there is image
                if (val[i].hasOwnProperty("image")) {
                    var BotResponse = "<div class='bot-msg'>" +
                        '<img class="msg-image" src="' + val[i].image + '">' +
                        '</div>'
                    $(BotResponse).appendTo('.chat-area').hide().fadeIn(1000);
                }

                //check if there are buttons
                if (val[i].hasOwnProperty("buttons")) {
                    var BotResponse = `<div class='bot-msg'><div class='response-btns'>`

                    buttonsArray = val[i].buttons;
                    buttonsArray.forEach(btn => {
                        BotResponse += `<button class='btn-primary' onclick= 'userResponseBtn(this)' value='${btn.payload}'>${btn.title}</button>`
                    })

                    BotResponse += "</div></div>"

                    $(BotResponse).appendTo('.chat-area').hide().fadeIn(1000);
                    chatInput.disabled = true;
                }

            }
            scrollToBottomOfResults();
            chatInput.disabled = false;
            chatInput.focus();
        }

    }, 500);
}




function mobileView() {
    $('.chat-popup').width($(window).width());

    if (chatPopup.style.display == "none") {
        chatPopup.style.display = "flex"
        // chatInput.focus();
        chatBtn.style.display = "none"
        chatPopup.style.bottom = "0"
        chatPopup.style.right = "0"
        // chatPopup.style.transition = "none"
        expandWindow.innerHTML = `<img src = "./icons/close.png" class = "icon" >`
    }
}

function detectMob() {
    return ((window.innerHeight <= 800) && (window.innerWidth <= 600));
}

function chatbotTheme(theme) {
    const gradientHeader = document.querySelector(".chat-header");
    const orange = {
        color: "#FBAB7E",
        background: "linear-gradient(19deg, #FBAB7E 0%, #F7CE68 100%)"
    }

    const purple = {
        color: "#B721FF",
        background: "linear-gradient(19deg, #21D4FD 0%, #B721FF 100%)"
    }



    if (theme === "orange") {
        root.style.setProperty('--chat-window-color-theme', orange.color);
        gradientHeader.style.backgroundImage = orange.background;
        chatSubmit.style.backgroundColor = orange.color;
    } else if (theme === "purple") {
        root.style.setProperty('--chat-window-color-theme', purple.color);
        gradientHeader.style.backgroundImage = purple.background;
        chatSubmit.style.backgroundColor = purple.color;
    }
}

function createChatBot(hostURL, botLogo, title, welcomeMessage, inactiveMsg, theme = "blue") {

    host = hostURL;
    botLogoPath = botLogo;
    inactiveMessage = inactiveMsg;
    init()
    const msg = document.querySelector(".msg");
    msg.innerText = welcomeMessage;

    const botTitle = document.querySelector(".bot-title");
    botTitle.innerText = title;

    chatbotTheme(theme)
}




function startConverting() {

    if ('webkitSpeechRecognition' in window) {
        var speechRecognizer = new webkitSpeechRecognition();
        speechRecognizer.continuous = false;
        speechRecognizer.interimResults = false;
        speechRecognizer.lang = 'en-US';
        speechRecognizer.start();

        var finalTranscripts = '';


        speechRecognizer.onresult = function (event) {
            var interimTranscripts = '';
            for (var i = event.resultIndex; i < event.results.length; i++) {
                var transcript = event.results[i][0].transcript;
                transcript.replace("\n", "<br>");
                if (event.results[i].isFinal) {
                    finalTranscripts += transcript;
                } else {
                    interimTranscripts += transcript;
                }
            }
            result = document.getElementById('result');
            result.value = finalTranscripts + interimTranscripts;

            setUserResponse()
            delayed_send(finalTranscripts + interimTranscripts);
        };
        speechRecognizer.onerror = function (event) {

        };
    } else {
        result.innerHTML = 'Your browser is not supported. Please download Google chrome or Update your Google chrome!!';
    }
}
//====================
var delayed_send = debounce(send);

function debounce(func, timeout = 100) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

const states = ['Idle', 'Walking', 'Running', 'Dance', 'Death', 'Sitting', 'Standing'];
const emotes = ['Jump', 'Yes', 'No', 'Wave', 'Punch', 'ThumbsUp'];

const intentActionMapping =  {
    'greet': () => {
        threeAPI.actions('playEmote', 'ThumbsUp')
    }, 
    'goodbye': () => {
        threeAPI.actions('playEmote', 'Wave')
    },
    'affirm': () => {
        threeAPI.actions('playEmote', 'Yes')
    },
    'deny':  () => {
        threeAPI.actions('playEmote', 'No')
    },
    'mood_great':  () => {
        threeAPI.actions('playEmote', 'Jump')
    },
    'mood_unhappy':  () => {
        threeAPI.actions('playEmote', 'Punch')
    },
    'bot_challenge':  () => {
        threeAPI.actions('playEmote', 'Punch')
    },
}

function playEmote(intent) {
    if(intent in intentActionMapping){
        intentActionMapping[intent].call();
    }
    else{
        //threeAPI.actions('changeState', 'Idle')
        threeAPI.actions('playRandomEmote')
    }

}