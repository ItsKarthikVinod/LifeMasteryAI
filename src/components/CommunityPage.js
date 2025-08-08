import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { FaThumbsUp, FaComment, FaTrash, FaTimes } from "react-icons/fa";
import Modal from "react-modal";
import { useAuth } from "../contexts/authContext";
import { Link } from "react-router-dom";
import { EditorState, convertToRaw } from "draft-js";
import { Editor } from "react-draft-wysiwyg";
import draftToHtml from "draftjs-to-html";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

Modal.setAppElement("#root");

const editorBoxStyle = (theme) => ({
  borderRadius: "0.75rem",
  border: theme === "dark" ? "2px solid #334155" : "2px solid #d1d5db",
  background: theme === "dark" ? "#1e293b" : "#f9fafb",
  color: theme === "dark" ? "#fff" : "#222",
  padding: "1rem",
  marginBottom: "1rem",
  minHeight: "180px",
  boxShadow: theme === "dark"
    ? "0 2px 8px rgba(0,0,0,0.7)"
    : "0 2px 8px rgba(0,0,0,0.08)",
  position: "relative",
});



const CommunityPage = () => {
  const [posts, setPosts] = useState([]);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState(EditorState.createEmpty());
  const [newComment, setNewComment] = useState(EditorState.createEmpty());
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const { currentUser, theme } = useAuth();
  const userName = currentUser?.displayName;
  const userId = currentUser?.uid;
  const adminEmail = "karthivinu1122@gmail.com";
  const [adminEmails, setAdminEmails] = useState([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const snapshot = await getDocs(collection(db, "admins"));
        if (snapshot.empty) {
          console.warn("No admins found in the database.");
          return;
        }
        const emails = snapshot.docs.map((doc) => doc.id);
        setAdminEmails(emails);
      } catch (err) {
        console.error("Error fetching admins:", err);
      }
    };
    fetchAdmins();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const postsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsData);
    } catch (error) {
      console.error("Error fetching posts: ", error);
    }
  };

  const addPost = async () => {
    const htmlContent = draftToHtml(convertToRaw(newPostContent.getCurrentContent()));
    if (!newPostTitle || !htmlContent || newPostContent.getCurrentContent().getPlainText().trim() === "") return;

    try {
      await addDoc(collection(db, "posts"), {
        title: newPostTitle,
        content: htmlContent,
        timestamp: serverTimestamp(),
        likes: 0,
        comments: [],
        likedBy: [],
        userName,
        userId,
        email: currentUser.email,
      });
      setNewPostTitle("");
      setNewPostContent(EditorState.createEmpty());
      fetchPosts();
      setModalIsOpen(false);
    } catch (error) {
      console.error("Error adding post: ", error);
    }
  };

  const addComment = async (postId) => {
    const htmlComment = draftToHtml(convertToRaw(newComment.getCurrentContent()));
    if (!htmlComment || newComment.getCurrentContent().getPlainText().trim() === "") return;

    const postRef = doc(db, "posts", postId);
    const post = posts.find((p) => p.id === postId);
    const updatedComments = [
      ...post.comments,
      {
        user: userName || "Anonymous User",
        content: htmlComment,
        timestamp: new Date(),
        email: currentUser.email,
      },
    ];

    try {
      await updateDoc(postRef, { comments: updatedComments });
      setNewComment(EditorState.createEmpty());
      fetchPosts();
    } catch (error) {
      console.error("Error adding comment: ", error);
    }
  };

  const toggleLike = async (postId) => {
    const postRef = doc(db, "posts", postId);
    const post = posts.find((p) => p.id === postId);
    const likedBy = post.likedBy || [];

    if (likedBy.includes(userId)) {
      const updatedLikedBy = likedBy.filter((id) => id !== userId);
      const updatedLikes = post.likes - 1;

      try {
        await updateDoc(postRef, {
          likedBy: updatedLikedBy,
          likes: updatedLikes,
        });
        fetchPosts();
      } catch (error) {
        console.error("Error unliking post: ", error);
      }
    } else {
      const updatedLikedBy = [...likedBy, userId];
      const updatedLikes = post.likes + 1;

      try {
        await updateDoc(postRef, {
          likedBy: updatedLikedBy,
          likes: updatedLikes,
        });
        fetchPosts();
      } catch (error) {
        console.error("Error liking post: ", error);
      }
    }
  };

  const deletePost = async (postId, postUser) => {
    if (currentUser?.email !== postUser && currentUser?.email !== adminEmail) {
      alert("You can only delete your own posts.");
      return;
    }

    const postRef = doc(db, "posts", postId);
    try {
      await deleteDoc(postRef);
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post: ", error);
    }
  };

  const deleteComment = async (postId, commentIndex) => {
    const postRef = doc(db, "posts", postId);
    const post = posts.find((p) => p.id === postId);
    const updatedComments = post.comments.filter(
      (_, index) => index !== commentIndex
    );

    try {
      await updateDoc(postRef, { comments: updatedComments });
      fetchPosts();
    } catch (error) {
      console.error("Error deleting comment: ", error);
    }
  };

  const openModal = () => {
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const toggleComments = (postId) => {
    setSelectedPostId(selectedPostId === postId ? null : postId);
  };

  const isAdmin = (email) => adminEmails.includes(email);
  const isGuest = currentUser && currentUser.isAnonymous;

  if (!currentUser) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center ${
          theme === "dark"
            ? "bg-gradient-to-r from-teal-900 to-blue-900"
            : "bg-gradient-to-r from-teal-400 to-blue-500"
        }  `}
      >
        <div
          className={`rounded-xl shadow-lg p-8 mt-24 flex flex-col items-center ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}
        >
          <h2
            className={`text-2xl font-bold mb-4 ${
              theme === "dark" ? "text-teal-400" : "text-teal-700"
            }`}
          >
            Please sign in to access the Community Forum
          </h2>
          <Link
            to="/login"
            className={`px-6 py-2 rounded-lg font-semibold shadow transition ${
              theme === "dark"
                ? "bg-teal-600 text-white hover:bg-teal-500"
                : "bg-teal-600 text-white hover:bg-teal-700"
            }`}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen mx-auto p-4 sm:p-8 lg:p-12 ${
        theme === "dark"
          ? "bg-gradient-to-r from-teal-900 to-blue-900 text-gray-200"
          : "bg-gradient-to-r from-teal-400 to-blue-500 text-gray-800"
      } ${isGuest === true ? "pt-[7rem] lg:pt-16" : "pt-0"}`}
    >
      <h2
        className={`text-3xl sm:text-4xl font-extrabold mb-8 lg:mt-20 mt-28 text-center ${
          theme === "dark" ? "text-teal-400" : "text-white"
        }`}
      >
        Community Forum
      </h2>

      {/* New Post Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={openModal}
          className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg text-sm sm:text-lg font-bold ${
            theme === "dark"
              ? "bg-teal-600 text-white hover:bg-teal-500"
              : "bg-teal-600 text-white hover:bg-teal-700"
          }`}
        >
          New Post
        </button>
      </div>

      {/* Posts List */}
      <div className="posts-list grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {posts.map((post) => (
          <div
            key={post.id}
            className={`post-card shadow-lg rounded-lg p-4 sm:p-6 ${
              isAdmin(post.email)
                ? theme === "dark"
                  ? "border-4 border-yellow-500 bg-gray-800"
                  : "border-4 border-yellow-500 bg-yellow-100"
                : theme === "dark"
                ? "bg-gray-800"
                : "bg-white"
            }`}
          >
            <h3
              className={`text-lg sm:text-xl font-extrabold mb-4 ${
                isAdmin(post.email)
                  ? theme === "dark"
                    ? "text-yellow-400"
                    : "text-yellow-900"
                  : theme === "dark"
                  ? "text-teal-400"
                  : "text-teal-700"
              }`}
            >
              {post.title}
              {isAdmin(post.email) && (
                <span
                  className={`ml-2 font-bold ${
                    theme === "dark" ? "text-yellow-400" : "text-yellow-700"
                  }`}
                >
                  (Admin)
                </span>
              )}
            </h3>
            <p
              className={`mb-4 ${
                theme === "dark" ? "text-gray-300" : "text-gray-800"
              }`}
              dangerouslySetInnerHTML={{ __html: post.content }}
            ></p>
            <p
              className={`text-sm mb-4 ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Posted by:{" "}
              <span
                className={`font-bold ${
                  theme === "dark" ? "text-teal-400" : "text-teal-700"
                }`}
              >
                {post.userName}
              </span>
              {isAdmin(post.email) && " (Admin)"}
            </p>
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center font-bold ${
                    theme === "dark" ? "text-teal-400" : "text-teal-600"
                  }`}
                >
                  <FaThumbsUp className="mr-1" />
                  {post.likes} Likes
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  className={`flex items-center font-bold ${
                    theme === "dark" ? "text-teal-400" : "text-teal-600"
                  }`}
                >
                  <FaComment className="mr-1" />
                  {post.comments.length} Comments
                </button>
              </div>
              <button
                onClick={() => deletePost(post.id, post.email)}
                className={`text-red-600 font-bold ${
                  currentUser?.email === adminEmail ||
                  currentUser?.email === post.email
                    ? "visible"
                    : "hidden"
                }`}
              >
                <FaTrash />
              </button>
            </div>

            {/* Comments Section */}
            {selectedPostId === post.id && (
              <div className="comments-section mt-6">
                <button
                  onClick={() => setSelectedPostId(null)}
                  className={`font-bold mb-4 flex items-center ${
                    theme === "dark" ? "text-red-400" : "text-red-600"
                  }`}
                >
                  <FaTimes className="mr-1" /> Close Comments
                </button>
                <div className="comments">
                  {post.comments.map((comment, index) => (
                    <div
                      key={index}
                      className={`comment mb-4 p-4 border-b ${
                        theme === "dark"
                          ? "border-gray-700 text-gray-300"
                          : "border-gray-300 text-gray-800"
                      }`}
                    >
                      <strong
                        className={`font-bold ${
                          theme === "dark" ? "text-teal-400" : "text-teal-700"
                        }`}
                      >
                        {comment.user}
                        {isAdmin(comment.email) && (
                          <span
                            className={`ml-2 font-bold ${
                              theme === "dark"
                                ? "text-yellow-400"
                                : "text-yellow-700"
                            }`}
                          >
                            (Admin)
                          </span>
                        )}
                      </strong>{" "}
                      <span
                        className={`text-xs ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {comment.timestamp?.toDate
                          ? comment.timestamp.toDate().toLocaleString()
                          : new Date(comment.timestamp).toLocaleString()}
                      </span>
                      <p
                        className="mt-2"
                        dangerouslySetInnerHTML={{ __html: comment.content }}
                      ></p>
                      {(currentUser?.email === adminEmail ||
                        currentUser?.email === comment?.email) && (
                        <button
                          onClick={() => deleteComment(post.id, index)}
                          className={`text-sm font-bold mt-2 ${
                            theme === "dark" ? "text-red-400" : "text-red-600"
                          }`}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div
                  className="add-comment mt-6"
                  style={{ position: "relative" }}
                >
                  <div style={editorBoxStyle(theme)}>
                    {newComment.getCurrentContent().getPlainText().trim() ===
                      "" && (
                      <div className="absolute top-40 sm:top-[6.5rem] left-[1.2rem] text-[#888] pointer-events-none font-md z-1">
                        Write your comment here...
                      </div>
                    )}
                    <Editor
                      editorState={newComment}
                      onEditorStateChange={setNewComment}
                      wrapperClassName="demo-wrapper"
                      editorClassName={`demo-editor ${
                        theme === "dark"
                          ? "bg-gray-800 text-gray-200"
                          : "bg-white text-gray-800"
                      }`}
                      toolbar={{
                        options: [
                          "inline",
                          "fontSize",
                          "list",
                          "textAlign",
                          "link",
                          "emoji",
                          "remove",
                          "history",
                        ],
                        inline: {
                          inDropdown: false,
                          options: ["bold", "italic", "underline"],
                        },
                        fontSize: {
                          options: [
                            8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48, 60,
                            72, 96,
                          ],
                        },
                      }}
                    />
                  </div>
                  <button
                    onClick={() => addComment(post.id)}
                    className={`px-6 py-3 rounded-full font-bold ${
                      theme === "dark"
                        ? "bg-teal-600 text-white hover:bg-teal-500"
                        : "bg-teal-600 text-white hover:bg-teal-700"
                    }`}
                  >
                    Add Comment
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal for New Post */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        className={`w-full sm:w-3/4 lg:w-1/2 mx-auto my-20 p-6  rounded-lg shadow-lg pt-32 ${
          theme === "dark"
            ? "bg-gray-800 text-gray-200"
            : "bg-white text-gray-800"
        }`}
      >
        <h2
          className={`text-xl sm:text-2xl font-extrabold mb-4 ${
            theme === "dark" ? "text-teal-400" : "text-gray-800"
          }`}
        >
          Create a New Post
        </h2>
        <input
          type="text"
          placeholder="Post Title"
          className={`w-full p-4 mb-4 border rounded-md ${
            theme === "dark"
              ? "bg-gray-800 border-gray-700 text-gray-200"
              : "bg-white border-gray-300 text-gray-800"
          }`}
          value={newPostTitle}
          onChange={(e) => setNewPostTitle(e.target.value)}
        />
        <div style={{ position: "relative" }}>
          <div style={editorBoxStyle(theme)}>
            {newPostContent.getCurrentContent().getPlainText().trim() ===
              "" && (
              <div className="absolute top-40 sm:top-20 left-[1.2rem] text-[#888] pointer-events-none font-md z-1">
                Write your post here...
              </div>
            )}
            <Editor
              editorState={newPostContent}
              onEditorStateChange={setNewPostContent}
              wrapperClassName="demo-wrapper"
              editorClassName={`demo-editor ${
                theme === "dark"
                  ? "bg-gray-800 text-gray-200"
                  : "bg-white text-gray-800"
              }`}
              toolbar={{
                options: [
                  "inline",
                  "fontSize",
                  "list",
                  "textAlign",
                  "link",
                  "emoji",
                  "remove",
                  "history",
                ],
                inline: {
                  inDropdown: false,
                  options: ["bold", "italic", "underline"],
                },
                fontSize: {
                  options: [
                    8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48, 60, 72, 96,
                  ],
                },
              }}
            />
          </div>
        </div>
        <div className="flex justify-between">
          <button
            onClick={addPost}
            className={`px-6 py-3 rounded-full font-bold ${
              theme === "dark"
                ? "bg-teal-600 text-white hover:bg-teal-500"
                : "bg-teal-600 text-white hover:bg-teal-700"
            }`}
          >
            Post
          </button>
          <button
            onClick={closeModal}
            className={`px-6 py-3 font-bold ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CommunityPage;