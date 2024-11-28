// -----------------------------------
// GLOBAL VARIABLES & SELECTORS
// -----------------------------------

let isEditing = false; // Tracks if we are editing or adding a flashcard
let editingCardIndex = null; // Tracks the index of the flashcard being edited
let currentQuizIndex = 0; // Tracks the current card in the quiz
let quizWindow = null; // Reference to the quiz popup window

// Flashcard Selectors
const flashcardListElement = document.querySelector(".flashcardList");
const addCardButton = document.getElementById("addCardButton");
const learnAllButton = document.getElementById("learnAllButton");
const learnUnlearnedButton = document.getElementById("learnUnlearnedButton");
const popupTitle = document.getElementById("popupTitle");
const popupActionButton = document.getElementById("popupActionButton");
const editFlashcardPopup = document.querySelector(".editFlashcardPopup");
const editFlashcardCloseButton = document.querySelector(
  ".editFlashcardCloseButton"
);
const editFlashcardFrontInput = document.getElementById("edit-flashcard-front");
const editFlashcardBackInput = document.getElementById("edit-flashcard-back");
const editFlashcardError = document.getElementById("editFlashcardError");

// Stack Name Selector
const stackNameElement = document.getElementById("stackName"); // Use this for stack name

// Stack Data
const stackId = getStackIdFromURL();
const stacks = JSON.parse(localStorage.getItem("flashcardStacks")) || [];
const currentStack = stacks.find((stack) => stack.id === Number(stackId));

if (!currentStack) {
  alert("Stack not found! Redirecting to the homepage.");
  window.location.href = "index.html";
}

// -----------------------------------
// HELPER FUNCTIONS
// -----------------------------------

// Get the stack ID from the URL
function getStackIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("stackId");
}

// Save stacks to LocalStorage
function saveStacksToLocalStorage() {
  const updatedStacks = stacks.map((stack) =>
    stack.id === currentStack.id ? currentStack : stack
  );
  localStorage.setItem("flashcardStacks", JSON.stringify(updatedStacks));
}

// Update Learned/Unlearned Counts
function updateStats() {
  const learned = currentStack.cards.filter((card) => card.learned).length;
  const unlearned = currentStack.cards.length - learned;

  document.getElementById("learnedCards").textContent = learned;
  document.getElementById("unlearnedCards").textContent = unlearned;
  document.getElementById("deckCount").textContent = currentStack.cards.length;
}

// -----------------------------------
// FLASHCARD FUNCTIONS
// -----------------------------------

// Render all flashcards in the list
function renderFlashcards() {
  flashcardListElement.innerHTML = ""; // Clear the list
  currentStack.cards.forEach((card, index) => {
    const flashcardItem = document.createElement("li");
    flashcardItem.classList.add("flashcardItem");

    flashcardItem.innerHTML = `
      <div class="flashcardContent">
        <p><strong>Front:</strong> ${card.front}</p>
        <p><strong>Back:</strong> ${card.back}</p>
      </div>
      <div class="flashcardActions">
        <i class="fa-solid fa-pen" data-action="edit" data-index="${index}"></i>
        <i class="fa-solid fa-trash" data-action="delete" data-index="${index}"></i>
      </div>
    `;
    flashcardListElement.appendChild(flashcardItem);
  });

  updateStats();
}

// Open the popup for adding/editing a flashcard
function openFlashcardPopup(editMode = false, cardIndex = null) {
  isEditing = editMode;

  if (isEditing) {
    popupTitle.textContent = "Edit Flashcard";
    popupActionButton.textContent = "Save Changes";

    const card = currentStack.cards[cardIndex];
    editingCardIndex = cardIndex;
    editFlashcardFrontInput.value = card.front;
    editFlashcardBackInput.value = card.back;
  } else {
    popupTitle.textContent = "Add Flashcard";
    popupActionButton.textContent = "Add Flashcard";

    editFlashcardFrontInput.value = "";
    editFlashcardBackInput.value = "";
  }

  editFlashcardPopup.classList.remove("hidden");
}

// Close the flashcard popup
function closeFlashcardPopup() {
  editFlashcardPopup.classList.add("hidden");
  editFlashcardError.classList.add("hidden");
}

// Save changes to a flashcard (add or edit)
function saveFlashcard() {
  const front = editFlashcardFrontInput.value.trim();
  const back = editFlashcardBackInput.value.trim();

  if (!front || !back) {
    editFlashcardError.textContent = "Please fill in both fields.";
    editFlashcardError.classList.remove("hidden");
    return;
  }

  if (isEditing) {
    currentStack.cards[editingCardIndex] = { front, back, learned: false };
  } else {
    currentStack.cards.push({ front, back, learned: false });
  }

  saveStacksToLocalStorage();
  renderFlashcards();
  closeFlashcardPopup();
}

// Delete a flashcard
function deleteFlashcard(index) {
  currentStack.cards.splice(index, 1);
  saveStacksToLocalStorage();
  renderFlashcards();
}

// -----------------------------------
// QUIZ MODE FUNCTIONS
// -----------------------------------

// Start the quiz mode
function startQuiz(filterUnlearned = false) {
  currentQuizIndex = 0;

  if (quizWindow) {
    quizWindow.close();
  }

  quizWindow = window.open("", "_blank", "width=600,height=400,scrollbars=no");

  const cardsToLearn = filterUnlearned
    ? currentStack.cards.filter((card) => !card.learned)
    : currentStack.cards.map((card) => {
        card.learned = false; // Reset learned status for "Learn All"
        return card;
      });

  saveStacksToLocalStorage(); // Save updated statuses
  updateStats();

  if (cardsToLearn.length === 0) {
    quizWindow.document.body.innerHTML = `
      <div style="text-align: center; font-family: Arial; padding: 20px; background-color: #1e1e1e; color: #ffffff;">
        <h1 style="color: #4caf50;">No cards to learn!</h1>
        <button onclick="window.close()" style="
          background-color: #4caf50; 
          color: white; 
          border: none; 
          padding: 10px 20px; 
          border-radius: 5px; 
          font-size: 1rem; 
          cursor: pointer;">Close</button>
      </div>
    `;
    return;
  }

  showNextCard(cardsToLearn);
}

// Show the next card in the quiz
function showNextCard(cardsToLearn) {
  if (currentQuizIndex >= cardsToLearn.length) {
    quizWindow.document.body.innerHTML = `
      <div style="text-align: center; font-family: Arial; padding: 20px; background-color: #1e1e1e; color: #ffffff;">
        <h1 style="color: #4caf50;">Quiz Completed!</h1>
        <p style="font-size: 1.2rem; margin-bottom: 20px;">You have reviewed all cards!</p>
        <button onclick="window.close()" style="
          background-color: #4caf50; 
          color: white; 
          border: none; 
          padding: 10px 20px; 
          border-radius: 5px; 
          font-size: 1rem; 
          cursor: pointer;">Close</button>
      </div>
    `;
    updateStats(); // Update stats after quiz
    return;
  }

  const card = cardsToLearn[currentQuizIndex];

  quizWindow.document.body.innerHTML = `
    <div style="text-align: center; font-family: Arial; padding: 20px; background-color: #1e1e1e; color: #ffffff;">
      <p style="font-size: 1.5rem; margin: 10px 0;">${card.front}</p>
      <p style="font-size: 1.5rem; margin: 10px 0;">${card.back}</p>
      <div style="margin-top: 20px;">
        <button id="knowButton" style="
          background-color: #4caf50; 
          color: white; 
          border: none; 
          padding: 10px 20px; 
          border-radius: 5px; 
          font-size: 1rem; 
          margin-right: 10px; 
          cursor: pointer;">I Know This</button>
        <button id="repeatButton" style="
          background-color: #f44336; 
          color: white; 
          border: none; 
          padding: 10px 20px; 
          border-radius: 5px; 
          font-size: 1rem; 
          cursor: pointer;">Repeat</button>
      </div>
    </div>
  `;

  quizWindow.document
    .getElementById("knowButton")
    .addEventListener("click", () => {
      card.learned = true; // Mark card as learned
      cardsToLearn.splice(currentQuizIndex, 1); // Remove from quiz
      saveStacksToLocalStorage();
      updateStats();
      showNextCard(cardsToLearn);
    });

  quizWindow.document
    .getElementById("repeatButton")
    .addEventListener("click", () => {
      const cardToRepeat = cardsToLearn[currentQuizIndex];
      cardsToLearn.push(cardToRepeat); // Add to end of quiz
      currentQuizIndex++; // Move to next card
      showNextCard(cardsToLearn);
    });
}

// -----------------------------------
// EVENT LISTENERS
// -----------------------------------

flashcardListElement.addEventListener("click", (event) => {
  const action = event.target.dataset.action;
  const index = event.target.dataset.index;

  if (action === "edit") {
    openFlashcardPopup(true, Number(index));
  } else if (action === "delete") {
    deleteFlashcard(Number(index));
  }
});

addCardButton.addEventListener("click", () => openFlashcardPopup(false));
popupActionButton.addEventListener("click", saveFlashcard);
editFlashcardCloseButton.addEventListener("click", closeFlashcardPopup);
learnAllButton.addEventListener("click", () => startQuiz(false)); // Learn all cards
learnUnlearnedButton.addEventListener("click", () => startQuiz(true)); // Learn unlearned cards

// -----------------------------------
// INITIALIZATION
// -----------------------------------

// Set the correct stack name
stackNameElement.textContent = currentStack.name; // Update only the stack name
renderFlashcards();
updateStats();
