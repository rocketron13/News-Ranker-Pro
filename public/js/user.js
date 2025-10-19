(function () {
  // DOM References
  const usernameInput = document.getElementById('usernameInput');
  const usernameForm = document.getElementById('usernameForm');
  const usernameMsg = document.getElementById('usernameMsg');
  const usernameBtn = document.getElementById('usernameBtn');

  let errors = [];

  console.log("user.js loaded!");

  // Validation function
  const checkUsername = (username) => {
    if (username === undefined) return errors.push("Please enter a username.");
    if (typeof username !== 'string') return errors.push("Please enter a username.");
    username = username.trim();
    if (username.length === 0) return errors.push("Please enter a username.");
    if (!/^[A-Za-z0-9_]+$/.test(username)) return errors.push("Username can only contain letters, numbers, and underscores.");
    if (username.length < 3) return errors.push("Username must be at least 3 characters long.");
  };

  // Only attach event listener if form exists
  if (usernameForm) {
    usernameForm.addEventListener('submit', (event) => {
      errors = [];
      usernameMsg.textContent = ''; // clear old messages

      const raw = usernameInput.value.trim();
      const username = raw.replace(/\s+/g, '_');
      checkUsername(username);

      if (errors.length > 0) {
        // Prevent submission to server
        event.preventDefault();
        usernameMsg.textContent = errors[0];
        return;
      }

      // Passed validation — disable button and let form submit to server
      usernameBtn.disabled = true;
      console.log("Client-side validation passed, submitting form to server...");
      // At this point, the form "falls through" to your Express route naturally
    });
  }
})();
