(() => {
  const form = document.getElementById("waitlist-form");
  const status = document.getElementById("waitlist-status");
  const signout = document.getElementById("launch-signout");
  if (signout) signout.addEventListener("click", async () => {
    signout.disabled = true;
    signout.textContent = "Signing out…";
    try {
      const response = await fetch("/api/auth/signout", { method: "POST" });
      const data = await response.json();
      if (!response.ok || data.ok !== true) throw new Error("Could not sign out. Please try again.");
      window.location.replace("/");
    } catch (error) {
      if (status) {
        status.textContent = error instanceof Error ? error.message : "Could not sign out. Please try again.";
        status.dataset.error = "true";
      }
      signout.disabled = false;
      signout.textContent = "Sign out";
    }
  });
  if (!form) return;
  const button = form.querySelector("button[type=submit]");
  const input = form.querySelector("input[name=email]");
  const trap = form.querySelector("input[name=website]");
  const fail = (message) => {
    status.textContent = message;
    status.dataset.error = "true";
  };
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const signedIn = form.dataset.signedIn === "true";
    const email = input ? input.value.trim() : "";
    if (!signedIn && !email) {
      fail("Enter your email address.");
      if (input) input.focus();
      return;
    }
    button.disabled = true;
    if (input) input.disabled = true;
    button.textContent = "Joining…";
    status.textContent = "";
    status.dataset.error = "false";
    try {
      const response = await fetch("/api/waitlist", signedIn ? { method: "POST" } : {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website: trap ? trap.value : "" }),
      });
      // The session expired, so reload to show the email form.
      if (signedIn && response.status === 400) {
        window.location.reload();
        return;
      }
      const data = await response.json();
      if (!response.ok || data.ok !== true) throw new Error(typeof data.error === "string" ? data.error : "Could not join the waitlist. Please try again.");
      status.textContent = "You’re on the waitlist. We’ll email you when we launch.";
      button.textContent = "Joined";
    } catch (error) {
      fail(error instanceof Error ? error.message : "Could not join the waitlist. Please try again.");
      button.disabled = false;
      if (input) input.disabled = false;
      button.textContent = "Join waitlist";
    }
  });
})();
