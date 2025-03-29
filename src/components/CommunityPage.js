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
  const { currentUser } = useAuth();
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
    <div className="bg-gradient-to-r from-teal-400 to-blue-500 min-h-screen mx-auto p-4 sm:p-8 lg:p-12 ">
      <h2 className="text-3xl sm:text-4xl font-extrabold mb-8 lg:mt-20 mt-28 text-center text-white">
        Community Forum
      </h2>

      <div className="flex justify-center mb-6">
        <button
          onClick={openModal}
          className="bg-teal-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full hover:bg-teal-700 shadow-lg text-sm sm:text-lg font-bold"
        >
          New Post
        </button>
      </div>

      <div className="posts-list grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {posts.map((post) => (
          <div
            key={post.id}
            className={`post-card shadow-lg rounded-lg p-4 sm:p-6 ${
              isAdmin(post.email)
                ? "border-4 border-yellow-500 bg-yellow-100"
                : "bg-white"
            }`}
          >
            <h3
              className={`text-lg sm:text-xl font-extrabold mb-4 ${
                isAdmin(post.email) ? "text-yellow-900" : "text-teal-700"
              }`}
            >
              {post.title}
              {isAdmin(post.email) && (
                <span className="text-yellow-700 ml-2 font-bold">(Admin)</span>
              )}
            </h3>
            <p
              className={
                isAdmin(post.email)
                  ? "text-gray-800 font-medium mb-4"
                  : "text-gray-800 mb-4"
              }
            >
              {post.content}
            </p>
            <p
              className={`text-sm mb-4 ${
                isAdmin(post.email)
                  ? "text-yellow-800 font-bold"
                  : "text-gray-600 font-medium"
              }`}
            >
              Posted by: <span className="font-bold">{post.userName}</span>
              {isAdmin(post.email) && " (Admin)"}
            </p>
            <div className="flex justify-between items-center">
              <div className="flex gap-4">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center font-bold ${
                    isAdmin(post.email) ? "text-yellow-800" : "text-teal-600"
                  }`}
                >
                  <FaThumbsUp className="mr-1" />
                  {post.likes} Likes
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  className={`flex items-center font-bold ${
                    isAdmin(post.email) ? "text-yellow-800" : "text-teal-600"
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

            {selectedPostId === post.id && (
              <div className="comments-section mt-6">
                <button
                  onClick={() => setSelectedPostId(null)}
                  className="text-red-600 font-bold mb-4 flex items-center"
                >
                  <FaTimes className="mr-1" /> Close Comments
                </button>
                <div className="comments">
                  {post.comments.map((comment, index) => (
                    <div
                      key={index}
                      className="comment mb-4 p-4 border-b border-gray-300"
                    >
                      <strong className="font-bold">
                        {comment.user}
                        {isAdmin(comment.email) && (
                          <span className="text-yellow-700 font-bold">
                            {" "}
                            (Admin)
                          </span>
                        )}
                      </strong>{" "}
                      <span className="text-gray-500 text-xs">
                        {comment.timestamp.toDate().toLocaleString()}
                      </span>
                      <p className="text-gray-800 mt-2 font-medium">
                        {comment.content}
                      </p>
                      {(currentUser?.email === adminEmail ||
                        currentUser?.email === comment?.email) && (
                        <button
                          onClick={() => deleteComment(post.id, index)}
                          className="text-red-600 text-sm font-bold mt-2"
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
                    className="w-full p-4 border border-gray-300 rounded-md mb-4 font-medium"
                    placeholder="Add a comment..."
                  />
                  <button
                    onClick={() => addComment(post.id)}
                    className="bg-teal-600 text-white px-6 py-3 rounded-full hover:bg-teal-700 font-bold"
                  >
                    Add Comment
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        className="w-full sm:w-3/4 lg:w-1/2 mx-auto my-20 p-6 sm:p-12 bg-white rounded-lg shadow-lg"
      >
        <h2 className="text-xl sm:text-2xl font-extrabold mb-4">
          Create a New Post
        </h2>
        <input
          type="text"
          placeholder="Post Title"
          className="w-full p-4 mb-4 border border-gray-300 rounded-md font-medium"
          value={newPostTitle}
          onChange={(e) => setNewPostTitle(e.target.value)}
        />
        <textarea
          placeholder="Post Content"
          className="w-full p-4 mb-4 border border-gray-300 rounded-md font-medium"
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
        />
        <div className="flex justify-between">
          <button
            onClick={addPost}
            className="bg-teal-600 text-white px-6 py-3 rounded-full hover:bg-teal-700 font-bold"
          >
            Post
          </button>
          <button
            onClick={closeModal}
            className="text-gray-600 px-6 py-3 font-bold"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default CommunityPage;
