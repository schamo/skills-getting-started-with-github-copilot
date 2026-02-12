document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select
      activitySelect.innerHTML = '<option value="">Select an activity</option>';

      // Helper to escape user-provided strings
      function escapeHtml(unsafe) {
        return String(unsafe).replace(/[&<>"']/g, function (m) {
          return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
        });
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build activity card content and participants list with unregister buttons
        const title = document.createElement('h4');
        title.textContent = name;

        const desc = document.createElement('p');
        desc.textContent = details.description;

        const sched = document.createElement('p');
        sched.innerHTML = `<strong>Schedule:</strong> ${escapeHtml(details.schedule)}`;

        const avail = document.createElement('p');
        avail.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

        const participantsLabel = document.createElement('p');
        participantsLabel.innerHTML = `<strong>Participants:</strong>`;

        const ul = document.createElement('ul');
        ul.className = 'participants-list';

        const participants = Array.isArray(details.participants) ? details.participants : [];
        if (participants.length === 0) {
          const li = document.createElement('li');
          li.className = 'no-participants';
          li.textContent = 'No participants yet';
          ul.appendChild(li);
        } else {
          participants.forEach((p) => {
            let display = '';
            let emailValue = '';
            if (typeof p === 'string') {
              display = p;
              emailValue = p;
            } else if (p && typeof p === 'object') {
              display = p.name || p.email || JSON.stringify(p);
              emailValue = p.email || display;
            } else {
              display = String(p);
              emailValue = display;
            }

            const li = document.createElement('li');
            li.className = 'participant-item';

            const span = document.createElement('span');
            span.className = 'participant-name';
            span.textContent = display;

            const btn = document.createElement('button');
            btn.className = 'unregister-btn';
            btn.setAttribute('data-activity', name);
            btn.setAttribute('data-email', emailValue);
            btn.setAttribute('aria-label', 'Unregister participant');
            btn.textContent = '✖';

            btn.addEventListener('click', async (e) => {
              e.preventDefault();
              const activityName = btn.getAttribute('data-activity');
              const email = btn.getAttribute('data-email');
              try {
                const resp = await fetch(
                  `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
                  { method: 'DELETE' }
                );
                const result = await resp.json();
                if (resp.ok) {
                  // Refresh activities to update UI
                  fetchActivities();
                } else {
                  messageDiv.textContent = result.detail || 'Failed to unregister';
                  messageDiv.className = 'error';
                  messageDiv.classList.remove('hidden');
                  setTimeout(() => messageDiv.classList.add('hidden'), 5000);
                }
              } catch (err) {
                console.error('Error unregistering:', err);
                messageDiv.textContent = 'Failed to unregister. Please try again.';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 5000);
              }
            });

            li.appendChild(span);
            li.appendChild(btn);
            ul.appendChild(li);
          });
        }

        // Assemble card
        activityCard.appendChild(title);
        activityCard.appendChild(desc);
        activityCard.appendChild(sched);
        activityCard.appendChild(avail);
        activityCard.appendChild(participantsLabel);
        activityCard.appendChild(ul);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the new participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
