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

Modal.setAppElement("#root");

const CommunityPage = () => {
  const [posts, setPosts] = useState([]);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newComment, setNewComment] = useState("");
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const { currentUser, theme } = useAuth();
  const userName = currentUser?.displayName;
  const userId = currentUser?.uid;
  const adminEmail = "karthivinu1122@gmail.com";

  useEffect(() => {
    fetchPosts();
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
    if (!newPostTitle || !newPostContent) return;

    try {
      await addDoc(collection(db, "posts"), {
        title: newPostTitle,
        content: newPostContent,
        timestamp: serverTimestamp(),
        likes: 0,
        comments: [],
        likedBy: [],
        userName,
        userId,
        email: currentUser.email,
      });
      setNewPostTitle("");
      setNewPostContent("");
      fetchPosts();
      setModalIsOpen(false);
    } catch (error) {
      console.error("Error adding post: ", error);
    }
  };

  const addComment = async (postId) => {
    if (!newComment) return;

    const postRef = doc(db, "posts", postId);
    const post = posts.find((p) => p.id === postId);
    const updatedComments = [
      ...post.comments,
      {
        user: userName || "Anonymous User",
        content: newComment,
        timestamp: new Date(),
        email: currentUser.email,
      },
    ];

    try {
      await updateDoc(postRef, { comments: updatedComments });
      setNewComment("");
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

  const isAdmin = (userEmail) => userEmail === adminEmail;

  return (
    <div
      className={`min-h-screen mx-auto p-4 sm:p-8 lg:p-12 ${
        theme === "dark"
          ? "bg-gray-900 text-gray-200"
          : "bg-gradient-to-r from-teal-400 to-blue-500 text-gray-800"
      }`}
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
            >
              {post.content}
            </p>
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
                        {comment.timestamp.toDate().toLocaleString()}
                      </span>
                      <p className="mt-2">{comment.content}</p>
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
                <div className="add-comment mt-6">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className={`w-full p-4 border rounded-md mb-4 ${
                      theme === "dark"
                        ? "bg-gray-800 border-gray-700 text-gray-200"
                        : "bg-white border-gray-300 text-gray-800"
                    }`}
                    placeholder="Add a comment..."
                  />
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
        className={`w-full sm:w-3/4 lg:w-1/2 mx-auto my-20 p-6 sm:p-12 rounded-lg shadow-lg ${
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
        <textarea
          placeholder="Post Content"
          className={`w-full p-4 mb-4 border rounded-md ${
            theme === "dark"
              ? "bg-gray-800 border-gray-700 text-gray-200"
              : "bg-white border-gray-300 text-gray-800"
          }`}
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
        />
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
