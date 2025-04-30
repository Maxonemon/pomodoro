document.addEventListener("DOMContentLoaded", () => {
  // Newsletter form handling
  const newsletterForm = document.getElementById("newsletter-form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = newsletterForm.querySelector('input[type="email"]').value;

      try {
        const response = await fetch("/api/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        if (response.ok) {
          alert("Thank you for subscribing!");
          newsletterForm.reset();
        } else {
          throw new Error("Subscription failed");
        }
      } catch (error) {
        alert("Sorry, there was an error. Please try again later.");
        console.error("Subscription error:", error);
      }
    });
  }

  // Contact form handling
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = {
        name: contactForm.querySelector('input[type="text"]').value,
        email: contactForm.querySelector('input[type="email"]').value,
        message: contactForm.querySelector("textarea").value,
      };

      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          alert("Thank you for your message! We will get back to you soon.");
          contactForm.reset();
        } else {
          throw new Error("Message sending failed");
        }
      } catch (error) {
        alert("Sorry, there was an error. Please try again later.");
        console.error("Contact form error:", error);
      }
    });
  }
});
