let uploadedFiles = [];
let progressBar;
let progressBarContainer;

document.addEventListener("DOMContentLoaded", function() {
    progressBar = document.getElementById('progress-bar');
    progressBarContainer = document.getElementById('progress-bar-container');
});

document.querySelector("form").addEventListener("submit", function (event) {
    event.preventDefault();
    const messageInput = document.querySelector('textarea[name="message"]');
    const message = messageInput.value.trim();
    const chatContainer = document.querySelector(".messages");

    // Append the user's message to the chat container
    if (message || uploadedFiles.length > 0) {
        const roleDiv = document.createElement("div");
        roleDiv.classList.add("message-role", "user");
        roleDiv.textContent = "User";
        chatContainer.appendChild(roleDiv);

        const userMessageDiv = document.createElement("div");
        userMessageDiv.classList.add("user-message");
        
        if (message) {
            userMessageDiv.textContent = message;
        }
        
        if (uploadedFiles.length > 0) {
            const filesInfo = document.createElement("div");
            filesInfo.classList.add("attached-files-info");
            filesInfo.textContent = "Attached files: " + uploadedFiles.map(file => file.name).join(", ");
            userMessageDiv.appendChild(filesInfo);
        }
        
        chatContainer.appendChild(userMessageDiv);
    }

    // Show progress bar
    progressBarContainer.classList.remove('hidden');
    progressBar.style.width = '10%';

    // Send the user's message to the server using AJAX
    fetch("/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
            message: message,
            files: uploadedFiles
        }),
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.success) {
            // Update progress bar
            progressBar.style.width = '30%';

            // Очистка поля ввода и списка загруженных файлов
            messageInput.value = "";
            uploadedFiles = [];
            updateAttachedFilesList();

            // Запуск потока для получения ответа от модели
            const eventSource = new EventSource("/stream");
            eventSource.onmessage = function (event) {
                // Update progress bar
                progressBar.style.width = '70%';

                const assistantMessageDiv = document.querySelector(".assistant-message:last-child") || 
                                            document.createElement("div");
                assistantMessageDiv.classList.add("assistant-message");
                assistantMessageDiv.textContent += event.data;
                chatContainer.appendChild(assistantMessageDiv);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            };
            eventSource.onerror = function () {
                eventSource.close();
                // Hide progress bar when finished
                progressBar.style.width = '100%';
                setTimeout(() => {
                    progressBarContainer.classList.add('hidden');
                    progressBar.style.width = '0';
                }, 300);
            };
        }
    });
});

document.getElementById('file-upload').addEventListener('change', function(event) {
    const files = event.target.files;
    if (files.length === 0) {
        console.log('Нет выбранных файлов');
        return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('file', files[i]);
    }

    console.log('Отправка файлов на сервер');
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Файлы успешно загружены:', data.files);
            uploadedFiles = uploadedFiles.concat(data.files);
            updateAttachedFilesList();
        } else {
            console.error('Ошибка загрузки файлов:', data.message);
        }
    })
    .catch(error => console.error('Ошибка:', error));
});

function updateAttachedFilesList() {
    const fileList = document.getElementById('attached-files-list');
    fileList.innerHTML = '';
    uploadedFiles.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.classList.add('attached-file-item');
        fileItem.innerHTML = `
            ${file.name}
            <button onclick="removeFile(${file.id})">X</button>
        `;
        fileList.appendChild(fileItem);
    });
}

function removeFile(fileId) {
    fetch('/remove_file', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_id: fileId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            uploadedFiles = uploadedFiles.filter(f => f.id !== fileId);
            updateAttachedFilesList();
        } else {
            console.error('Ошибка удаления файла:', data.message);
        }
    })
    .catch(error => console.error('Ошибка:', error));
}