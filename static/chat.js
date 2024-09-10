document.querySelector("form").addEventListener("submit", function (event) {
    event.preventDefault();
    const messageInput = document.querySelector(
        'textarea[name="message"]'
    );
    const message = messageInput.value.trim();
    const chatContainer = document.querySelector(".messages");

    // Append the user's message to the chat container
    if (message) {
        const roleDiv = document.createElement("div");
        roleDiv.classList.add("message-role");
        roleDiv.classList.add("user");

        roleDiv.textContent = "User";
        chatContainer.appendChild(roleDiv);

        const userMessageDiv = document.createElement("div");
        userMessageDiv.classList.add("user-message");
        userMessageDiv.textContent = message;
        chatContainer.appendChild(userMessageDiv);
    }

    // Clear the message input
    messageInput.value = "";

    // Send the user's message to the server using AJAX
    fetch("/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: message }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                const roleDiv = document.createElement("div");
                roleDiv.classList.add("message-role");
                roleDiv.classList.add("assistant");

                roleDiv.textContent = "Model";
                chatContainer.appendChild(roleDiv);

                // Prepare the model message container
                const assistantMessageDiv = document.createElement("div");
                assistantMessageDiv.classList.add("assistant-message");
                chatContainer.appendChild(assistantMessageDiv);

                // Open a connection to receive streamed responses
                const eventSource = new EventSource("/stream");
                eventSource.onmessage = function (event) {
                    const currentText = assistantMessageDiv.textContent;
                    const newText = event.data;
                    const lastChar = currentText.slice(-1);

                    // Check if we need to add a space (streamed chunks might be missing it)
                    if (/[.,!?]/.test(lastChar) && newText.charAt(0) !== " ") {
                        assistantMessageDiv.textContent += " " + newText;
                    } else {
                        assistantMessageDiv.textContent += newText;
                    }

                    // Scroll to the bottom of the chat container
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                };
                eventSource.onerror = function () {
                    eventSource.close();
                };
            }
        });
});