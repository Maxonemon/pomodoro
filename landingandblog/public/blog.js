document.addEventListener("DOMContentLoaded", async () => {
  const blogContent = document.getElementById("blog-content");
  const postId = new URLSearchParams(window.location.search).get("id");

  if (postId) {
    try {
      const response = await fetch(`/api/posts/${postId}`);
      if (response.ok) {
        const post = await response.json();
        blogContent.innerHTML = convertMarkdownToHtml(post.content);
      } else {
        blogContent.innerHTML = "<p>Post not found</p>";
      }
    } catch (error) {
      console.error("Error loading post:", error);
      blogContent.innerHTML = "<p>Error loading post</p>";
    }
  } else {
    try {
      const response = await fetch("/api/posts");
      if (response.ok) {
        const posts = await response.json();
        displayPostList(posts);
      } else {
        blogContent.innerHTML = "<p>Error loading posts</p>";
      }
    } catch (error) {
      console.error("Error loading posts:", error);
      blogContent.innerHTML = "<p>Error loading posts</p>";
    }
  }
});

function displayPostList(posts) {
  const blogContent = document.getElementById("blog-content");
  blogContent.innerHTML = `
        <h1>Blog Posts</h1>
        <div class="post-list">
            ${posts
              .map(
                (post) => `
                <div class="post-preview">
                    <h2><a href="/blog?id=${post.id}">${post.title}</a></h2>
                    <p class="post-date">${new Date(
                      post.date
                    ).toLocaleDateString()}</p>
                    <p class="post-excerpt">${post.excerpt}</p>
                </div>
            `
              )
              .join("")}
        </div>
    `;
}

function convertMarkdownToHtml(markdown) {
  // Basic markdown conversion
  let html = markdown
    // Headers
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    // Lists
    .replace(/^\* (.*$)/gm, "<li>$1</li>")
    // Code blocks
    .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    // Inline code
    .replace(/`(.*?)`/g, "<code>$1</code>")
    // Blockquotes
    .replace(/^> (.*$)/gm, "<blockquote>$1</blockquote>")
    // Paragraphs
    .replace(/^(?!<[a-z])(.*$)/gm, "<p>$1</p>");

  return html;
}
