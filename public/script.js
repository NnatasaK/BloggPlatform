

const socket = io();

socket.on("connect", () => {
    console.log("User connected!");
});

// Note: not clear completely
const userIdElement = document.getElementById('userId');
const userId = userIdElement ? userIdElement.dataset.userId : null;

const likeButtons = document.querySelectorAll('.btn-like');
const commentLikes = document.querySelectorAll('.comment-likes');
const postLikes = document.querySelectorAll('.post-likes');

// Initial likes count
let initialCommentLikesCount = {};
let initialPostLikesCount = {};

socket.on("likeUpdate", (data) => {
    if (data.commentId) {
        // Update the likes count for the specific comment
        initialCommentLikesCount[data.commentId] = data.likes.likes;
        const commentLikes = document.getElementById(`likes_comment_${data.commentId}`);
        updateLikesCount(commentLikes, data.likes.likes);
    } else if (data.postId) {
        // Update the likes count for the specific post
        initialPostLikesCount[data.postId] = data.likes.likes;
        const postLikes = document.getElementById(`likes_post_${data.postId}`);
        updateLikesCount(postLikes, data.likes.likes);
    }
});


likeButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
        event.preventDefault();
        const commentId = button.getAttribute('data-comment-id');
        const postId = button.getAttribute('data-post-id');

        if (commentId) {
            socket.emit("liked", { commentId, userId });
        } else if (postId) {
            socket.emit("liked", { postId, userId });
        } else {
            console.error("Not found");
        }
    });
});

function updateLikesCount(element, count) {
    // Check if the element exists 
    if (element) {
        element.textContent = count;
    } else {
        console.error("Likes element not found.");
    }
}

socket.on('likeNotification', (data) => {
    const notificationMessage = data.type === 'comment'
        ? `Your comment  was liked by ${data.currentUser}.`
        : `Your post  was liked by ${data.currentUser}.`;
    // Display a notification on the page
    displayNotification(notificationMessage);
});

// Trying a banner instead of an alert
// Function to display a notification
function displayNotification(message) {
    const notificationBanner = document.createElement('div');
    notificationBanner.className = 'notification';
    notificationBanner.textContent = message;

    // Add the notification banner to the page
    document.body.appendChild(notificationBanner);

    // Automatically remove the banner after a few seconds
    setTimeout(() => {
        notificationBanner.remove();
    }, 5000);
}


/* socket.on('likeNotification', (data) => {
    const notificationMessage = data.type === 'comment'
        ? `Your comment  was liked by ${data.currentUser}.`
        : `Your post  was liked by ${data.currentUser}.`;

    
    alert(notificationMessage);
}); */