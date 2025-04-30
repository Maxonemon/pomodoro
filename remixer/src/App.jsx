import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaEdit,
  FaSave,
  FaTrash,
  FaTwitter,
} from "react-icons/fa";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [inputText, setInputText] = useState("");
  const [tweetVariations, setTweetVariations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [saveStatus, setSaveStatus] = useState({});
  const [savedTweets, setSavedTweets] = useState([]);
  const [showSavedTweets, setShowSavedTweets] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [editingSavedTweet, setEditingSavedTweet] = useState(null);

  // Fetch saved tweets when the component mounts or when showSavedTweets changes
  useEffect(() => {
    if (showSavedTweets) {
      fetchSavedTweets();
    }
  }, [showSavedTweets]);

  const fetchSavedTweets = async () => {
    setIsLoadingSaved(true);
    try {
      const { data, error } = await supabase
        .from("tweets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedTweets(data || []);
    } catch (error) {
      console.error("Error fetching saved tweets:", error);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleDeleteTweet = async (id) => {
    try {
      const { error } = await supabase.from("tweets").delete().eq("id", id);

      if (error) throw error;
      setSavedTweets(savedTweets.filter((tweet) => tweet.id !== id));
    } catch (error) {
      console.error("Error deleting tweet:", error);
    }
  };

  const handleRemix = async () => {
    setIsLoading(true);
    try {
      console.log("apikey", import.meta.env.VITE_MISTRAL_API_KEY);
      const response = await fetch(
        "https://api.mistral.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_MISTRAL_API_KEY}`,
          },
          body: JSON.stringify({
            model: "mistral-small",
            messages: [
              {
                role: "user",
                content: `Act as a Twitter expert who creates viral content. Create 5 different tweet variations for the following content. Each tweet must be under 200 characters and optimized for maximum engagement. Make them catchy and emotional, but DO NOT use any emojis. Content to remix: ${inputText}`,
              },
            ],
          }),
        }
      );

      const data = await response.json();
      if (data.choices && data.choices[0]?.message?.content) {
        // Split the response into 5 variations and clean up the output
        const variations = data.choices[0].message.content
          .split("\n")
          .filter((line) => line.trim().length > 0)
          .map((line) => line.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim()) // Remove emojis
          .filter((line) => line.length > 0) // Remove empty lines after emoji removal
          .slice(0, 5);
        setTweetVariations(variations);
        // Reset save status for new variations
        setSaveStatus({});
      } else {
        throw new Error("Invalid response from API");
      }
    } catch (error) {
      console.error("Error generating tweets:", error);
      setTweetVariations([
        "Error: Failed to generate tweets. Please try again.",
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (index) => {
    try {
      setSaveStatus((prev) => ({ ...prev, [index]: "saving" }));

      const { data, error } = await supabase.from("tweets").insert([
        {
          content: tweetVariations[index],
          original_content: inputText,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setSaveStatus((prev) => ({ ...prev, [index]: "saved" }));
      setTimeout(() => {
        setSaveStatus((prev) => ({ ...prev, [index]: null }));
      }, 2000);
    } catch (error) {
      console.error("Error saving tweet:", error);
      setSaveStatus((prev) => ({ ...prev, [index]: "error" }));
    }
  };

  const handleTweet = (index) => {
    const tweetText = encodeURIComponent(tweetVariations[index]);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, "_blank");
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
    setEditedText(tweetVariations[index]);
  };

  const handleSaveEdit = (index) => {
    const newVariations = [...tweetVariations];
    newVariations[index] = editedText;
    setTweetVariations(newVariations);
    setEditingIndex(null);
  };

  const getSaveButtonText = (index) => {
    switch (saveStatus[index]) {
      case "saving":
        return "Saving...";
      case "saved":
        return "Saved!";
      case "error":
        return "Error";
      default:
        return "Save";
    }
  };

  const handleEditSavedTweet = async (id) => {
    try {
      const { error } = await supabase
        .from("tweets")
        .update({ content: editedText })
        .eq("id", id);

      if (error) throw error;

      setSavedTweets(
        savedTweets.map((tweet) =>
          tweet.id === id ? { ...tweet, content: editedText } : tweet
        )
      );
      setEditingSavedTweet(null);
    } catch (error) {
      console.error("Error updating tweet:", error);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          Viral Tweet Generator
        </h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your content to transform into viral tweets
            </label>
            <textarea
              className="w-full h-40 p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter your content here..."
            />
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleRemix}
              disabled={isLoading || !inputText}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Generating..." : "Generate Viral Tweets"}
            </button>
          </div>

          {tweetVariations.length > 0 && (
            <div className="mt-8 space-y-6">
              <h2 className="text-xl font-semibold text-center">
                Generated Tweet Variations
              </h2>
              {tweetVariations.map((tweet, index) => (
                <div
                  key={index}
                  className="p-4 bg-white border rounded-lg shadow-sm"
                >
                  {editingIndex === index ? (
                    <div className="space-y-2">
                      <textarea
                        className="w-full p-2 border rounded"
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                      />
                      <button
                        onClick={() => handleSaveEdit(index)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Save Edit
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="mb-2">{tweet}</p>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(index)}
                          className="p-2 text-blue-500 hover:text-blue-700"
                          title="Edit"
                        >
                          <FaEdit size={20} />
                        </button>
                        <button
                          onClick={() => handleTweet(index)}
                          className="p-2 text-blue-500 hover:text-blue-700"
                          title="Tweet"
                        >
                          <FaTwitter size={20} />
                        </button>
                        <button
                          onClick={() => handleSave(index)}
                          disabled={saveStatus[index] === "saving"}
                          className={`p-2 ${
                            saveStatus[index] === "saved"
                              ? "text-green-500"
                              : saveStatus[index] === "error"
                              ? "text-red-500"
                              : "text-green-500 hover:text-green-700"
                          }`}
                          title={getSaveButtonText(index)}
                        >
                          <FaSave size={20} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Saved Tweets Section */}
          <div className="mt-8">
            <button
              onClick={() => setShowSavedTweets(!showSavedTweets)}
              className="w-full flex items-center justify-between p-4 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <h2 className="text-xl font-semibold">Saved Tweets</h2>
              {showSavedTweets ? <FaChevronUp /> : <FaChevronDown />}
            </button>

            {showSavedTweets && (
              <div className="mt-4 space-y-4">
                {isLoadingSaved ? (
                  <div className="text-center py-4">
                    Loading saved tweets...
                  </div>
                ) : savedTweets.length === 0 ? (
                  <div className="text-center py-4">No saved tweets yet</div>
                ) : (
                  savedTweets.map((tweet) => (
                    <div
                      key={tweet.id}
                      className="p-4 bg-white border rounded-lg shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-gray-600 text-sm">
                          {new Date(tweet.created_at).toLocaleString()}
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingSavedTweet(tweet.id);
                              setEditedText(tweet.content);
                            }}
                            className="p-2 text-blue-500 hover:text-blue-700"
                            title="Edit"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteTweet(tweet.id)}
                            className="p-2 text-red-500 hover:text-red-700"
                            title="Delete"
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                      </div>
                      {editingSavedTweet === tweet.id ? (
                        <div className="space-y-2">
                          <textarea
                            className="w-full p-2 border rounded"
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingSavedTweet(null)}
                              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleEditSavedTweet(tweet.id)}
                              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="mb-2">{tweet.content}</p>
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                const tweetText = encodeURIComponent(
                                  tweet.content
                                );
                                window.open(
                                  `https://twitter.com/intent/tweet?text=${tweetText}`,
                                  "_blank"
                                );
                              }}
                              className="p-2 text-blue-500 hover:text-blue-700"
                              title="Tweet"
                            >
                              <FaTwitter size={20} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
