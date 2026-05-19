const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatWindow = document.getElementById('chatWindow');
const focusInputButton = document.getElementById('focusInput');
const resetChatButton = document.getElementById('resetChat');
const quickTips = document.querySelectorAll('.tip-btn');

const responses = [
  {
    triggers: ['study', 'homework', 'exam'],
    reply: "A good study plan starts with a short review block, a quick break, and a second pass through your notes. I can help you turn any topic into an easy checklist.",
  },
  {
    triggers: ['website', 'design', 'page'],
    reply: "For a project page, focus on clear sections, bold headings, and a friendly chat experience. We can also add animated cards or a project summary panel.",
  },
  {
    triggers: ['ai', 'artificial intelligence', 'assistant'],
    reply: "AI means using patterns from data to generate smart answers. Nova is a helper page interface built with HTML, CSS, and JavaScript.",
  },
  {
    triggers: ['fun fact', 'fact'],
    reply: "Fun fact: The first chatbot was created in 1966 and named ELIZA. Today, modern assistants are built with much more advanced programming and design.",
  },
];

const defaultReplies = [
  "That sounds like a great question — I can help you with project ideas, study tips, or website design guidance.",
  "Let's figure this out together. Tell me more about what you need for your class project.",
  "I can answer questions, suggest a plan, or help make your AI assistant page look even better.",
];

function createMessage(text, type = 'assistant') {
  const wrapper = document.createElement('div');
  wrapper.className = `message message-${type}`;

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = type === 'assistant' ? 'N' : 'Y';

  const body = document.createElement('div');
  body.className = 'message-body';
  body.innerHTML = `<p>${text}</p>`;

  if (type === 'assistant') {
    wrapper.append(avatar, body);
  } else {
    wrapper.append(body, avatar);
  }

  return wrapper;
}

function getReply(message) {
  const normalized = message.toLowerCase();
  for (const { triggers, reply } of responses) {
    if (triggers.some((term) => normalized.includes(term))) {
      return reply;
    }
  }
  return defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
}

function addAssistantReply(text) {
  const message = createMessage('Nova is typing...', 'assistant');
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  setTimeout(() => {
    message.remove();
    chatWindow.appendChild(createMessage(text, 'assistant'));
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }, 900);
}

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  chatWindow.appendChild(createMessage(text, 'user'));
  chatInput.value = '';
  chatWindow.scrollTop = chatWindow.scrollHeight;

  const reply = getReply(text);
  addAssistantReply(reply);
});

focusInputButton.addEventListener('click', () => {
  chatInput.focus();
});

resetChatButton.addEventListener('click', () => {
  chatWindow.innerHTML = '';
  chatWindow.appendChild(createMessage('Hey there! I’m Nova, your AI assistant. Try asking for a study tip, website idea, or a fun fact.', 'assistant'));
  chatInput.value = '';
  chatInput.focus();
});

quickTips.forEach((button) => {
  button.addEventListener('click', () => {
    const prompt = button.textContent;
    chatInput.value = prompt;
    chatInput.focus();
  });
});
