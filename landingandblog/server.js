const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const marked = require("marked");
const nodemailer = require("nodemailer");
const fs = require("fs");

const app = express();
const port = 3003;

// Email configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/blog", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "blog.html"));
});

// API Routes
app.post("/api/subscribe", async (req, res) => {
  try {
    const { email } = req.body;

    // Send confirmation email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Newsletter Subscription Confirmation",
      text: "Thank you for subscribing to our newsletter!",
    });

    // Store subscriber email (you might want to use a database in production)
    const subscribersFile = path.join(__dirname, "data", "subscribers.json");
    let subscribers = [];

    if (fs.existsSync(subscribersFile)) {
      subscribers = JSON.parse(fs.readFileSync(subscribersFile));
    }

    if (!subscribers.includes(email)) {
      subscribers.push(email);
      fs.writeFileSync(subscribersFile, JSON.stringify(subscribers, null, 2));
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Subscription error:", error);
    res.status(500).json({ error: "Subscription failed" });
  }
});

app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ error: "Message sending failed" });
  }
});

// Blog API Routes
app.get("/api/posts", (req, res) => {
  try {
    const postsDir = path.join(__dirname, "posts");
    const posts = fs
      .readdirSync(postsDir)
      .filter((file) => file.endsWith(".md"))
      .map((file) => {
        const content = fs.readFileSync(path.join(postsDir, file), "utf8");
        const [title, ...rest] = content.split("\n");
        return {
          id: file.replace(".md", ""),
          title: title.replace("# ", ""),
          excerpt: rest.join("\n").substring(0, 200) + "...",
          date: fs.statSync(path.join(postsDir, file)).mtime,
        };
      });
    res.json(posts);
  } catch (error) {
    console.error("Error reading posts:", error);
    res.status(500).json({ error: "Error reading posts" });
  }
});

app.get("/api/posts/:id", (req, res) => {
  try {
    const postPath = path.join(__dirname, "posts", `${req.params.id}.md`);
    if (fs.existsSync(postPath)) {
      const content = fs.readFileSync(postPath, "utf8");
      res.json({
        id: req.params.id,
        content: marked.parse(content),
      });
    } else {
      res.status(404).json({ error: "Post not found" });
    }
  } catch (error) {
    console.error("Error reading post:", error);
    res.status(500).json({ error: "Error reading post" });
  }
});

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
