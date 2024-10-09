globalThis.document.addEventListener("DOMContentLoaded", () => {
  const cDate = document.querySelectorAll(".cDate");
  const ct = document.querySelectorAll(".cDiv8 div");

  const cSubmit = document.getElementById("cSubmit");

  const rForm = document.querySelectorAll(".rForm");

  let currentOffset = Number(count) || 0;
  let pid = Number(id) || 0;
  let now = Number(usa) || 0;
  
  // console.log(n, t);

  // console.log(count, id, now);

  // let replyOffset = 0;
  const replyOffsets = {};

  const postStates = {}; // To track button states for each post

  // Initialize state for a post
  function initializePostState(id) {
    postStates[id] = {
      liked: false,
      disliked: false,
    };
  }

  const replyStates = {}; // To track button states for each post

  // Initialize state for a post
  function initializeReplyState(id) {
    replyStates[id] = {
      liked: false,
      disliked: false,
    };
  }

  // console.log(comment);
  // console.log(currentOffset);

  function formatDateDifference(dateString) {
    // console.log(now, dateString, now-Number(dateString));
    
    const diffSec = now - Number(dateString);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30); // Approximate month length
    const diffYear = Math.floor(diffDay / 365); // Approximate year length

    let result;
    if (diffSec < 60) {
        result = `${diffSec} seconds ago`;
    } else if (diffMin < 60) {
        result = `${diffMin} minutes ago`;
    } else if (diffHour < 24) {
        result = `${diffHour} hours ago`;
    } else if (diffDay < 7) {
        result = `${diffDay} days ago`;
    } else if (diffWeek < 4) {
        result = `${diffWeek} weeks ago`;
    } else if (diffMonth < 12) {
        result = `${diffMonth} months ago`;
    } else {
        result = `${diffYear} years ago`;
    }
    
    // console.log(result);
    
    return result;
  }

  cDate.forEach(async (element) => {
    const dateStr = element.textContent.trim();
    // formatDateDifference(dateStr);
    element.textContent = formatDateDifference(dateStr);
  });

  function truncateText(text) {
    const words = text.split(" "); // Split the text into words
    if (words.length > 10) {
      return words.slice(0, 8).join(" ") + "...";
    }
    return text; // Return the original text if it's 50 words or less
  }

  const textContents = document.querySelectorAll(".text-content");

  textContents.forEach((textContent) => {
    const fullText = textContent.getAttribute("data-full-text"); // Retrieve the full text
    const truncated = truncateText(fullText);

    // Check if the full text needs to be truncated
    if (fullText.split(" ").length > 10) {
      textContent.textContent = truncated;
      textContent.parentElement.querySelector(".toggle-button").style.display =
        "block"; // Show the toggle button
    } else {
      textContent.textContent = fullText;
      textContent.parentElement.querySelector(".toggle-button").style.display =
        "none"; // Hide the toggle button
    }

    // Add click event listener to toggle button
    textContent.parentElement
      .querySelector(".toggle-button")
      .addEventListener("click", () => {
        if (textContent.textContent === truncated) {
          textContent.textContent = fullText; // Show full text
        } else {
          textContent.textContent = truncated; // Show truncated text
        }
      });
  });

  globalThis.document.querySelectorAll(".like_btn").forEach((button) => {
    button.addEventListener("click", function (e) {
      const showId = this.getAttribute("data-btn-id");
      const btn = this.querySelector(".fa-thumbs-up");
      updateLikeBtn(showId, btn, this);
    });
  });

  globalThis.document.querySelectorAll(".dislike_btn").forEach((button) => {
    button.addEventListener("click", function (e) {
      const showId = this.getAttribute("data-btn-id");
      const btn = this.querySelector(".fa-thumbs-down");
      updateDislikeBtn(showId, btn, this);
    });
  });

  globalThis.document.querySelectorAll(".cBtn1").forEach((button) => {
    button.addEventListener("click", function (e) {
      const showId = this.getAttribute("data-btn-id");
      const replyBlock = globalThis.document.getElementById(`cReply_${showId}`);

      // Toggle the display of the subtitle file input
      if (
        replyBlock.style.display === "none" ||
        replyBlock.style.display === ""
      ) {
        replyBlock.style.display = "block";
      } else {
        replyBlock.style.display = "none";
      }
    });
  });

  globalThis.document.querySelectorAll(".replyBtn").forEach((button) => {
    button.addEventListener("click", function (e) {
      const showId = this.getAttribute("data-btn-id");
      const replyBlock = globalThis.document.getElementById(
        `carteDown_${showId}`
      );

      const showReplyDiv = globalThis.document.getElementById(
        `cDiv11_${showId}`
      );

      // Toggle the display of the subtitle file input
      if (replyBlock.classList.contains("fa-angle-down")) {
        replyBlock.classList.remove("fa-angle-down");
        replyBlock.classList.add("fa-angle-up");
        showReplyDiv.style.display = "block";

        // console.log(showId, replyIds);
        document.querySelector(".loading-spinner").style.display = "block";

        fetchReply(showId, this);
      } else {
        replyBlock.classList.remove("fa-angle-up");
        replyBlock.classList.add("fa-angle-down");
        showReplyDiv.style.display = "none";
      }
    });
  });

  function fetchReply(id, btn) {
    // console.log(id, btn);

    const formdata = new FormData();
    formdata.append("commId", id);
    formdata.append("offset", replyOffsets[id] || "0");

    const requestOptions = {
      method: "POST",
      body: formdata,
      redirect: "follow",
    };

    fetch("https://api.hiphopboombox.com/api/get/replies.php", requestOptions)
      .then((response) => response.json())
      .then((result) => {
        const showId = btn.getAttribute("data-btn-id");
        // console.log(result, showId);

        if (result && result.results.length > 0) {
          // replyOffset = Number(result.length);
          replyOffsets[id] = (replyOffsets[id] || 0) + result.results.length;
          renderReplies(result.results, result.usaTimestamp, showId);
        } else {
          document.querySelector(".loading-spinner").style.display = "none";
        }
      })
      .catch((error) => console.log(error));
  }

  function renderReplies(replies, time, id) {
    const newDiv = document.createElement("div");
    newDiv.className = "cDiv12";

    const showDiv = document.getElementById(`cDiv11_${id}`);

    showDiv.innerHTML = "";

    const resultHTML = replies
      .map((reply) => {
        const imageUrl = reply.image
          ? !reply.image.includes("www.w3schools") &&
            !reply.image.includes("static.worldstarhiphop")
            ? `https://api.hiphopboombox.com/api/uploads/${reply.image}`
            : reply.image
          : `https://dummyimage.com/100x100/000/fff&text=${
              reply.name ? reply.name.charAt(0).toUpperCase() : "A"
            }`;

        return `
				<div class="crDiv1 d-flex mb-3">
				    <img
				    	src="${imageUrl}" 
				        alt="..." class="cImg2" loading="lazy" 
				    />
				    <div class="cDiv13 d-flex flex-column p-0 border-0 w-100">
				        <div class="cDiv7 d-flex align-items-center">
				            <div class="me-3 cName2">${reply.name}</div>
				            <div class="text-secondary cDate2">${reply.date}</div>
				        </div>
				        <div class="cDiv8">
				            ${reply.text}
				        </div>
				        <div class="cDiv9 border-0 d-flex justify-content-around align-items-center">
				            <button class="reply_like_btn" data-btn-id="${reply.id}">
				                <i class="fa-regular fa-thumbs-up me-1" style="color: black;"></i>
				                <span class="reply_like_text" id="reply_like_text_<%= reply.id %>">${reply.likes}</span>
				            </button>
				            <button class="reply_dislike_btn" data-btn-id="${reply.id}">
				                <i class="fa-regular fa-thumbs-down me-1" style="color: black;"></i>
				                <span class="reply_dislike_text" id="reply_dislike_text_<%= reply.id %>">${reply.dislikes}</span>
				            </button>
				        </div>
				    </div>
				</div>
			`;
      })
      .join("");

    newDiv.innerHTML = resultHTML;

    const loadingIndicator = document.createElement("div");
    loadingIndicator.className = "reply_loading";
    loadingIndicator.id = `rid_${id}`;
    loadingIndicator.textContent = "Loading...";
    loadingIndicator.style.display = "inline-block";

    // Append resultHTML and loadingIndicator to newDiv
    newDiv.appendChild(loadingIndicator);

    // Initialize IntersectionObserver to watch the loading indicator
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // console.log(document.getElementById(`rid_${id}`));
            // The loader is visible in the viewport
            anotherFunction(id); // Call the function if conditions are met
            document.getElementById(`rid_${id}`).style.display = "none"; // Update the text
            // Optionally, stop observing if the action only needs to happen once
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null, // Use the viewport as the container
        rootMargin: "0px",
        threshold: 1.0, // Trigger when the loader is fully visible
      }
    );

    // Start observing the loading indicator
    observer.observe(loadingIndicator);

    const cDate2 = newDiv.querySelectorAll(".cDate2");
    // console.log(cDate2);
    
    function formatDateDifference(dateString) {
      // console.log(time, dateString, time-Number(dateString));

      const diffSec = time - Number(dateString);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      const diffWeek = Math.floor(diffDay / 7);
      const diffMonth = Math.floor(diffDay / 30); // Approximate month length
      const diffYear = Math.floor(diffDay / 365); // Approximate year length

      let result;
      if (diffSec < 60) {
          result = `${diffSec} seconds ago`;
      } else if (diffMin < 60) {
          result = `${diffMin} minutes ago`;
      } else if (diffHour < 24) {
          result = `${diffHour} hours ago`;
      } else if (diffDay < 7) {
          result = `${diffDay} days ago`;
      } else if (diffWeek < 4) {
          result = `${diffWeek} weeks ago`;
      } else if (diffMonth < 12) {
          result = `${diffMonth} months ago`;
      } else {
          result = `${diffYear} years ago`;
      }
    
      // console.log(result);

      return result;
    }

    cDate2.forEach((element) => {
      const dateStr = element.textContent.trim();
      element.textContent = formatDateDifference(dateStr);
    });

    showDiv.appendChild(newDiv);

    document.querySelector(".reply_loading").style.display = "block";
    document.querySelector(".loading-spinner").style.display = "none";

    globalThis.document
      .querySelectorAll(".reply_like_btn")
      .forEach((button) => {
        button.addEventListener("click", function (e) {
          const showId = this.getAttribute("data-btn-id");
          const btn = this.querySelector(".fa-thumbs-up");
          updateReplyLikeBtn(showId, btn, this);
        });
      });

    globalThis.document
      .querySelectorAll(".reply_dislike_btn")
      .forEach((button) => {
        button.addEventListener("click", function (e) {
          const showId = this.getAttribute("data-btn-id");
          const btn = this.querySelector(".fa-thumbs-down");
          updateReplyDislikeBtn(showId, btn, this);
        });
      });
  }

  function updateLikeBtn(id, btn, e) {
    const likeCountElement = e.querySelector(`#like_text_${id}`);
    const dislikeElement = e.nextElementSibling.querySelector(
      `#dislike_text_${id}`
    );
    // console.log(likeCountElement);

    if (!postStates[id]) {
      initializePostState(id);
    }

    if (btn.classList.contains("fa-solid")) {
      btn.classList.remove("fa-solid");
      btn.classList.add("fa-regular");
      postStates[id].liked = false;
      if (postStates[id].liked == false && postStates[id].disliked == false) {
        // console.log("1st liked then unliked...");
        updateLikeDislike("1", id);
        // console.log(likeCountElement.textContent);
        likeCountElement.textContent =
          parseInt(likeCountElement.textContent) - 1;
      }
    } else {
      btn.classList.remove("fa-regular");
      btn.classList.add("fa-solid");
      postStates[id].liked = true;

      if (postStates[id].liked == true && postStates[id].disliked == false) {
        // console.log("only liked...");
        updateLikeDislike("0", id);
        likeCountElement.textContent =
          parseInt(likeCountElement.textContent) + 1;
      } else if (
        postStates[id].liked == true &&
        postStates[id].disliked == true
      ) {
        // console.log("first disliked then liked...");
        updateLikeDislike("4", id);
        likeCountElement.textContent =
          parseInt(likeCountElement.textContent) + 1;
        dislikeElement.textContent = parseInt(dislikeElement.textContent) - 1;
      }
    }

    const nextBtn = e.nextElementSibling.querySelector(".fa-thumbs-down");
    nextBtn.classList.remove("fa-solid");
    nextBtn.classList.add("fa-regular");

    // console.log(postStates);
  }

  function updateDislikeBtn(id, btn, e) {
    // console.log(id);

    const dislikeElement = e.querySelector(`#dislike_text_${id}`);
    const likeElement = e.previousElementSibling.querySelector(
      `#like_text_${id}`
    );

    if (!postStates[id]) {
      initializePostState(id);
    }

    if (btn.classList.contains("fa-solid")) {
      btn.classList.remove("fa-solid");
      btn.classList.add("fa-regular");
      postStates[id].disliked = false;
      if (postStates[id].disliked == false && postStates[id].liked == false) {
        // console.log("1st disliked then undisliked...");
        updateLikeDislike("3", id);
        // console.log(likeCountElement.textContent);
        dislikeElement.textContent = parseInt(dislikeElement.textContent) - 1;
      }
    } else {
      btn.classList.remove("fa-regular");
      btn.classList.add("fa-solid");
      postStates[id].disliked = true;

      if (postStates[id].disliked == true && postStates[id].liked == false) {
        // console.log("only disliked...");
        updateLikeDislike("2", id);
        // console.log(likeCountElement.textContent);
        dislikeElement.textContent = parseInt(dislikeElement.textContent) + 1;
      } else if (
        postStates[id].disliked == true &&
        postStates[id].liked == true
      ) {
        // console.log("first liked then disliked...");
        updateLikeDislike("5", id);
        dislikeElement.textContent = parseInt(dislikeElement.textContent) + 1;
        likeElement.textContent = parseInt(likeElement.textContent) - 1;
      }
    }

    const prevBtn = e.previousElementSibling.querySelector(".fa-thumbs-up");
    prevBtn.classList.remove("fa-solid");
    prevBtn.classList.add("fa-regular");

    // console.log(postStates);
  }

  function updateReplyLikeBtn(id, btn, e) {
    // console.log(id);

    const likeCountElement = e.querySelector(`#reply_like_text_${id}`);
    const dislikeElement = e.nextElementSibling.querySelector(
      `#reply_dislike_text_${id}`
    );

    if (!replyStates[id]) {
      initializeReplyState(id);
    }

    if (btn.classList.contains("fa-solid")) {
      btn.classList.remove("fa-solid");
      btn.classList.add("fa-regular");
      replyStates[id].liked = false;
      if (replyStates[id].liked == false && replyStates[id].disliked == false) {
        // console.log("1st liked then unliked...");
        updateReplyLikeDislike("1", id);
        likeCountElement.textContent =
          parseInt(likeCountElement.textContent) - 1;
      }
    } else {
      btn.classList.remove("fa-regular");
      btn.classList.add("fa-solid");
      replyStates[id].liked = true;

      if (replyStates[id].liked == true && replyStates[id].disliked == false) {
        // console.log("only liked...");
        updateReplyLikeDislike("0", id);
        likeCountElement.textContent =
          parseInt(likeCountElement.textContent) + 1;
      } else if (
        replyStates[id].liked == true &&
        replyStates[id].disliked == true
      ) {
        // console.log("first disliked then liked...");
        updateReplyLikeDislike("4", id);
        likeCountElement.textContent =
          parseInt(likeCountElement.textContent) + 1;
        dislikeElement.textContent = parseInt(dislikeElement.textContent) - 1;
      }
    }
    const nextBtn = e.nextElementSibling.querySelector(".fa-thumbs-down");
    nextBtn.classList.remove("fa-solid");
    nextBtn.classList.add("fa-regular");
  }

  function updateReplyDislikeBtn(id, btn, e) {
    // console.log(id);

    const likeCountElement = e.previousElementSibling.querySelector(
      `#reply_like_text_${id}`
    );
    const dislikeElement = e.querySelector(`#reply_dislike_text_${id}`);

    if (!replyStates[id]) {
      initializeReplyState(id);
    }

    if (btn.classList.contains("fa-solid")) {
      btn.classList.remove("fa-solid");
      btn.classList.add("fa-regular");
      replyStates[id].disliked = false;
      if (replyStates[id].disliked == false && replyStates[id].liked == false) {
        // console.log("1st disliked then undisliked...");
        updateReplyLikeDislike("3", id);
        dislikeElement.textContent = parseInt(dislikeElement.textContent) - 1;
      }
    } else {
      btn.classList.remove("fa-regular");
      btn.classList.add("fa-solid");
      replyStates[id].disliked = true;

      if (replyStates[id].disliked == true && replyStates[id].liked == false) {
        // console.log("only disliked...");
        updateReplyLikeDislike("2", id);
        dislikeElement.textContent = parseInt(dislikeElement.textContent) + 1;
      } else if (
        replyStates[id].disliked == true &&
        replyStates[id].liked == true
      ) {
        // console.log("first liked then disliked...");
        updateReplyLikeDislike("5", id);
        dislikeElement.textContent = parseInt(dislikeElement.textContent) + 1;
        likeCountElement.textContent =
          parseInt(likeCountElement.textContent) - 1;
      }
    }
    const prevBtn = e.previousElementSibling.querySelector(".fa-thumbs-up");
    prevBtn.classList.remove("fa-solid");
    prevBtn.classList.add("fa-regular");
  }

  function addItems() {
    const formdata = new FormData();
    formdata.append("postId", pid);
    formdata.append("offset", currentOffset);

    const requestOptions = {
      method: "POST",
      body: formdata,
      redirect: "follow",
    };

    fetch("https://api.hiphopboombox.com/api/get/comments.php", requestOptions)
      .then((response) => response.json())
      .then((result) => {
        // console.log(result);
        if (result.results.length > 0) {
          // Append new items to the DOM
          renderItems(result); // You should implement this function to update the DOM with new items
          currentOffset += Number(result.length); // Update offset with the number of newly fetched items
        }

        // Optionally, you can stop observing if no more data to fetch
        if (result.results.length === 0) {
          // console.log("hii...");
          document.getElementById("watch_end_of_document").style.display =
            "none";
          io.unobserve(document.getElementById("watch_end_of_document"));
        }
      })
      .catch((error) => console.log(error));
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // console.log(entry);
        if (entry.isIntersecting) {
          addItems();
        }
      });
    },
    { threshold: 1.0 }
  );

  // Observe the target element only if `comment` is not empty
  if (comment !== "") {
    const targetElement = document.getElementById("watch_end_of_document");
    if (targetElement) {
      if (comment.length >= 3) {
        io.observe(targetElement);
      }
      else {
        targetElement.style.display = 'none';
      }
    } else {
      console.error(
        "Target element with ID 'watch_end_of_document' not found."
      );
    }
  }

  function renderItems(items) {
    // Get the container where new items should be appended
    const container = document.getElementById("another");

    // Create the HTML string by mapping over the items
    const itemsHTML = items
      .map(
        (item) => `
	        <div class="cDiv5 d-flex">
	            <img src="${
                !item.image.includes("www.w3schools") &&
                !item.image.includes("static.worldstarhiphop")
                  ? `https://api.hiphopboombox.com/api/uploads/${item.image}`
                  : item.image
              }" alt="..." class="cImg1" loading="lazy" />
	            <div class="cDiv6 d-flex flex-column p-0">
	                <div class="cDiv7 d-flex">
	                    <div class="me-3">${item.name}</div>
	                    <div class="text-secondary cDate">${item.date}</div>
	                </div>
	                <div class="cDiv8">
	                    ${item.text}
	                </div>
	                <div class="cDiv9 border-0 d-flex justify-content-around align-items-center">
	                    <button class="like_btn" data-btn-id="${item.id}">
	                        <i class="fa-regular fa-thumbs-up me-1" style="color: black;"></i>${
                            item.likes
                          }
	                    </button>
	                    <button class="dislike_btn" data-btn-id="${item.id}">
	                        <i class="fa-regular fa-thumbs-down me-1" style="color: black;"></i>${
                            item.dislikes
                          }
	                    </button>
	                    <button 
	                        class="cBtn1" 
	                        data-btn-id="${item.id}"
	                    >Reply</button>
	                </div>
	                <div class="cReply" id="cReply_${item.id}">
	                    <form action="/v1/addReply" method="post" id="rForm">
	                        <input type="text" name="reply" class="cInput" placeholder="Add a reply..." />
	                        <input type="hidden" name="cid" value="${id}" />
	                        <input type="hidden" name="id" value="${item.id}" />
                          <input type="hidden" name="n" value"${n}" />
                          <input type="hidden" name="t" value"${t}" />
	                        <button type="submit" id="rfBtn" style="border: 0; background: transparent;"><i class="fa-solid fa-square-arrow-up-right fa-2xl" style="color: black;"></i></button>
	                    </form>
	                </div>
	                <div class="cDiv10">
	                    <button class="replyBtn" data-btn-id="${item.id}">
	                        <i class="fa-solid fa-angle-down me-2" id="carteDown_${
                            item.id
                          }" 
	                            style="color: black;"
	                        ></i>Show Replies
	                    </button>

	                    <div class="cDiv11" id="cDiv11_${item.id}">
	                    </div>
	                </div>
	            </div>
	        </div>
	    `
      )
      .join("");

    globalThis.document.querySelectorAll(".replyBtn").forEach((button) => {
      button.addEventListener("click", function (e) {
        const showId = this.getAttribute("data-btn-id");
        const replyBlock = globalThis.document.getElementById(
          `carteDown_${showId}`
        );

        const showReplyDiv = globalThis.document.getElementById(
          `cDiv11_${showId}`
        );

        // Toggle the display of the subtitle file input
        if (replyBlock.classList.contains("fa-angle-down")) {
          replyBlock.classList.remove("fa-angle-down");
          replyBlock.classList.add("fa-angle-up");
          showReplyDiv.style.display = "block";

          // console.log(showId, replyIds);
          document.querySelector(".loading-spinner").style.display = "block";

          fetchReply(showId, this);
        } else {
          replyBlock.classList.remove("fa-angle-up");
          replyBlock.classList.add("fa-angle-down");
          showReplyDiv.style.display = "none";
        }
      });
    });

    const rForm = document.getElementById("rForm");

    rForm.addEventListener("submit", (e) => {
      e.preventDefault();

      if (rForm.reply.value.trim() !== "") {
        rForm.querySelector("#rfBtn i").style.color = "black";
        rForm.submit();
      } else {
        rForm.querySelector("#rfBtn i").style.color = "grey";
      }
    });

    // Append the generated HTML to the container
    container.insertAdjacentHTML("beforeend", itemsHTML);
  }

  function anotherFunction(id) {
    // console.log(id);
  }

  function updateLikeDislike(value, id) {
    // console.log(value, id);

    const formdata = new FormData();
    formdata.append("value", value);
    formdata.append("id", id);

    const requestOptions = {
      method: "POST",
      body: formdata,
      redirect: "follow",
    };

    fetch(
      "https://api.hiphopboombox.com/api/update/commentLikeDis.php",
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => console.log(result))
      .catch((error) => console.error(error));
  }

  function updateReplyLikeDislike(value, id) {
    // console.log(value, id);

    const formdata = new FormData();
    formdata.append("value", value);
    formdata.append("id", id);

    const requestOptions = {
      method: "POST",
      body: formdata,
      redirect: "follow",
    };

    fetch(
      "https://api.hiphopboombox.com/api/update/replyLikeDis.php",
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => console.log(result))
      .catch((error) => console.error(error));
  }

  cSubmit.addEventListener("submit", (e) => {
    e.preventDefault();

    // console.log(cSubmit.comment.value);

    if (cSubmit.comment.value.trim() !== "") {
      cSubmit.querySelector("#cfBtn i").style.color = "black";
      cSubmit.submit();
    } else {
      cSubmit.querySelector("#cfBtn i").style.color = "grey";
    }
  });

  rForm.forEach((i) => {
    i.addEventListener("submit", (e) => {
      e.preventDefault();

      if (i.reply.value.trim() !== "") {
        i.querySelector("#rfBtn i").style.color = "black";
        i.submit();
      } else {
        i.querySelector("#rfBtn i").style.color = "grey";
      }
    });
  });
});
