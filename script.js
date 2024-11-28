const stacks = [];
let nextStacksID = 0;

/* ----------------- LOCALSTORAGE FUNCTIONS ----------------- */

function saveStacksToLocalStorage() {
  localStorage.setItem("flashcardStacks", JSON.stringify(stacks));
}

function loadStacksFromLocalStorage() {
  const storedStacks = localStorage.getItem("flashcardStacks");
  if (storedStacks) {
    return JSON.parse(storedStacks);
  }
  return [];
}

/* ----------------- INITIALIZATION ----------------- */

window.addEventListener("DOMContentLoaded", () => {
  const loadedStacks = loadStacksFromLocalStorage();
  stacks.push(...loadedStacks);
  nextStacksID =
    stacks.length > 0 ? Math.max(...stacks.map((stack) => stack.id)) + 1 : 0;
  stacks.forEach(updateStack);
});

/* ----------------- CREATE STACK POPUP ----------------- */

const closeBtn = document.querySelector(".closeButton");
const createStackPopup = document.querySelector(".createStackPopup");
const createNewStackButton = document.querySelector(".createNewStackButton");

const createStack = document.querySelector(".createStack");
const stackNameInput = document.getElementById("stack-name");
const stackNameError = document.getElementById("stackNameError");

createNewStackButton.addEventListener("click", () => {
  createStackPopup.classList.remove("hidden");
});

closeBtn.addEventListener("click", () => {
  createStackPopup.classList.add("hidden");
});

createStack.addEventListener("click", () => {
  const stackName = stackNameInput.value.trim();

  if (stackName === "") {
    stackNameError.textContent = "Please enter a valid stack name.";
    stackNameError.classList.remove("hidden");
    return;
  }

  if (stacks.some((stack) => stack.name === stackName)) {
    stackNameError.textContent = "A stack with this name already exists.";
    stackNameError.classList.remove("hidden");
    return;
  }

  stackNameError.classList.add("hidden");

  const newStack = { id: nextStacksID++, name: stackName, cards: [] };
  stacks.push(newStack);

  createStackPopup.classList.add("hidden");
  stackNameInput.value = "";

  updateStack(newStack);
  saveStacksToLocalStorage();
});

stackNameInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    createStack.click();
  }
});

function updateStack(stack) {
  const stackList = document.querySelector(".stackList");
  const stackBox = document.createElement("div");
  stackBox.className = "stackBox";
  stackBox.setAttribute("data-id", stack.id);
  stackBox.innerHTML = `
    <div class="stackName">${stack.name}</div>
    <div class="stackIcons">
      <i class="fa-regular fa-square-plus"></i>
      <i class="fa-solid fa-trash"></i>
      <i class="fa-solid fa-pen"></i>
    </div>
  `;
  stackList.appendChild(stackBox);
}

/* ----------------- DELETE STACK ----------------- */

const stackList = document.querySelector(".stackList");
const deleteStackPopup = document.querySelector(".deleteStackPopup");
const deleteCloseButton = document.querySelector(".deleteCloseButton");
const deleteStackConfirmButton = document.querySelector(
  ".deleteStackConfirmButton"
);

let deletingStackId = null;

stackList.addEventListener("click", (event) => {
  if (event.target.classList.contains("fa-trash")) {
    const stackBox = event.target.closest(".stackBox");
    deletingStackId = Number(stackBox.getAttribute("data-id"));

    deleteStackPopup.classList.remove("hidden");
  }
});

deleteCloseButton.addEventListener("click", () => {
  deleteStackPopup.classList.add("hidden");
});

deleteStackConfirmButton.addEventListener("click", () => {
  const stackIndex = stacks.findIndex((stack) => stack.id === deletingStackId);
  if (stackIndex !== -1) {
    stacks.splice(stackIndex, 1);
  }

  const stackBox = document.querySelector(
    `.stackBox[data-id="${deletingStackId}"]`
  );
  if (stackBox) {
    stackBox.remove();
  }

  deleteStackPopup.classList.add("hidden");
  saveStacksToLocalStorage();
});

/* ----------------- EDIT STACKNAME ----------------- */

const editStackPopup = document.querySelector(".editStackPopup");
const editCloseButton = document.querySelector(".editCloseButton");
const editStackNameInput = document.getElementById("edit-stack-name");
const editStackNameError = document.getElementById("editStackNameError");
const editStackSaveButton = document.querySelector(".editStackSave");

let editingStackId = null;

stackList.addEventListener("click", (event) => {
  if (event.target.classList.contains("fa-pen")) {
    const stackBox = event.target.closest(".stackBox");
    editingStackId = Number(stackBox.getAttribute("data-id"));

    const stack = stacks.find((stack) => stack.id === editingStackId);
    if (stack) {
      editStackNameInput.value = stack.name;
    }

    editStackPopup.classList.remove("hidden");
  }
});

editCloseButton.addEventListener("click", () => {
  editStackPopup.classList.add("hidden");
});

editStackSaveButton.addEventListener("click", () => {
  const newStackName = editStackNameInput.value.trim();

  if (newStackName === "") {
    editStackNameError.textContent = "Please enter a valid stack name.";
    editStackNameError.classList.remove("hidden");
    return;
  }

  editStackNameError.classList.add("hidden");

  const stack = stacks.find((stack) => stack.id === editingStackId);
  if (stack) {
    stack.name = newStackName;
  }

  const stackBox = document.querySelector(
    `.stackBox[data-id="${editingStackId}"]`
  );
  if (stackBox) {
    stackBox.querySelector(".stackName").textContent = newStackName;
  }

  editStackPopup.classList.add("hidden");
  saveStacksToLocalStorage();
});

/* ----------------- ADD FLASHCARDS ----------------- */

const addFlashcardPopup = document.querySelector(".addFlashcardPopup");
const addFlashcardCloseButton = document.querySelector(
  ".addFlashcardCloseButton"
);
const createFlashcardButton = document.querySelector(".createFlashcardButton");
const flashcardFrontInput = document.getElementById("flashcard-front");
const flashcardBackInput = document.getElementById("flashcard-back");
const flashcardError = document.getElementById("flashcardError");

let currentStackId = null;

stackList.addEventListener("click", (event) => {
  if (event.target.classList.contains("fa-square-plus")) {
    const stackBox = event.target.closest(".stackBox");
    currentStackId = Number(stackBox.getAttribute("data-id"));
    addFlashcardPopup.classList.remove("hidden");
  }
});

addFlashcardCloseButton.addEventListener("click", () => {
  addFlashcardPopup.classList.add("hidden");
  flashcardFrontInput.value = "";
  flashcardBackInput.value = "";
  flashcardError.classList.add("hidden");
});

createFlashcardButton.addEventListener("click", () => {
  const frontText = flashcardFrontInput.value.trim();
  const backText = flashcardBackInput.value.trim();

  if (frontText === "" || backText === "") {
    flashcardError.textContent = "Please fill in both fields.";
    flashcardError.classList.remove("hidden");
    return;
  }

  flashcardError.classList.add("hidden");

  const stack = stacks.find((stack) => stack.id === currentStackId);
  if (stack) {
    stack.cards.push({ front: frontText, back: backText });
  }

  addFlashcardPopup.classList.add("hidden");
  flashcardFrontInput.value = "";
  flashcardBackInput.value = "";

  saveStacksToLocalStorage();
});

stackList.addEventListener("click", (event) => {
  const stackBox = event.target.closest(".stackBox");
  if (!stackBox) return;

  if (
    event.target.classList.contains("fa-trash") ||
    event.target.classList.contains("fa-pen") ||
    event.target.classList.contains("fa-square-plus")
  ) {
    return;
  }

  const stackId = stackBox.getAttribute("data-id");
  window.location.href = `flashcards.html?stackId=${stackId}`;
});
