let submissions = [];
let lastSubmissionCount = 0;
let userId = Date.now() + Math.random().toString(36).substr(2, 9);

async function submitSentence() {
  const userInput = document.getElementById("userInput");
  const text = userInput.value.trim();
  if (!text) return;

  try {
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, userId }),
    });

    if (response.ok) {
      userInput.value = "";
      await loadSubmissions();
    }
  } catch (error) {
    console.error("Error submitting:", error);
  }
}

async function loadSubmissions() {
  try {
    const response = await fetch("/api/submit?uid=" + userId);
    if (response.ok) {
      const data = await response.json();
      submissions = data.submissions;
      lastSubmissionCount = data.count;
      displaySubmissions();
      updateUserCount(data.activeUsers);
    }
  } catch (error) {
    console.error("Error loading:", error);
  }
}

function displaySubmissions() {
  const submissionsDiv = document.getElementById("submissions");
  submissionsDiv.innerHTML = "";

  submissions.forEach((submission) => {
    const sentenceDiv = document.createElement("div");
    sentenceDiv.textContent = submission.text;
    sentenceDiv.style.margin = "10px 0";
    sentenceDiv.style.padding = "10px";
    sentenceDiv.style.backgroundColor = "white";
    sentenceDiv.style.color = "black";
    sentenceDiv.style.borderRadius = "5px";
    sentenceDiv.style.border = "1px solid #ddd";
    sentenceDiv.style.fontFamily = "Times New Roman, serif";
    sentenceDiv.style.fontSize = "16px";
    submissionsDiv.appendChild(sentenceDiv);
  });
}

function updateUserCount(count) {
  const el = document.getElementById("userCount");
  if (el) {
    el.textContent = `${count} people embedding futures`;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  loadSubmissions();

  // Poll every 3 seconds - also tracks user activity
  setInterval(async () => {
    try {
      const response = await fetch("/api/submit?uid=" + userId);
      if (response.ok) {
        const data = await response.json();
        if (data.count !== lastSubmissionCount) {
          submissions = data.submissions;
          lastSubmissionCount = data.count;
          displaySubmissions();
        }
        updateUserCount(data.activeUsers);
      }
    } catch (error) {
      console.error("Poll error:", error);
    }
  }, 3000);
});
