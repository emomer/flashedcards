// src/pages/StackDetail.jsx
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import LearnMode from "./LearnMode";
import {
  collection,
  onSnapshot,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { MdEdit, MdDelete, MdCheck, MdClose } from "react-icons/md";

export default function StackDetail() {
  const { id } = useParams();
  const {
    currentUser,
    isDemo,
    demoStacks,
    addDemoCard,
    editDemoCard,
    deleteDemoCard,
  } = useAuth();

  const [cards, setCards] = useState([]);
  const [stackName, setStackName] = useState("");

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");

  const [learnedCards, setLearnedCards] = useState(0);
  const [unlearnedCards, setUnlearnedCards] = useState(0);

  const [showConfirmLearnAll, setShowConfirmLearnAll] = useState(false);

  const MODES = {
    ALL: "all",
    UNLEARNED: "unlearned",
    NONE: null,
  };

  const [learningMode, setLearningMode] = useState(MODES.NONE);

  // Load cards from Firestore or Demo
  useEffect(() => {
    if (isDemo) {
      const demo = demoStacks.find((s) => s.id === id);
      if (demo) {
        setStackName(demo.name);
        setCards(demo.cards);
      } else {
        setStackName("Unbekannter Demo-Stack");
        setCards([]);
      }
      return;
    }
    if (!currentUser) return;
    const colRef = collection(
      db,
      "users",
      currentUser.uid,
      "stacks",
      id,
      "cards"
    );
    const unsub = onSnapshot(colRef, (snap) => {
      setCards(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });
    return unsub;
  }, [currentUser, isDemo, id, demoStacks]);

  // Count learned/unlearned
  useEffect(() => {
    const learned = cards.filter((c) => c.learned).length;
    setLearnedCards(learned);
    setUnlearnedCards(cards.length - learned);
  }, [cards]);

  // lade zusätzlich den Stack-Datensatz für
  useEffect(() => {
    if (isDemo) return; // Demo-Modus kümmert sich bereits um stackName
    if (!currentUser) return;

    // Referenz auf das Stack-Dokument
    const stackDocRef = doc(db, "users", currentUser.uid, "stacks", id);

    // einmalig holen (kann auch onSnapshot sein, falls Du Live-Updates willst)
    getDoc(stackDocRef).then((snap) => {
      if (snap.exists()) {
        setStackName(snap.data().name);
      } else {
        setStackName("Unbekannter Stack");
      }
    });
  }, [currentUser, isDemo, id]);

  // Add new card
  async function handleAddCard(e) {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;

    if (isDemo) {
      addDemoCard(id, front, back);
    } else {
      const colRef = collection(
        db,
        "users",
        currentUser.uid,
        "stacks",
        id,
        "cards"
      );
      await addDoc(colRef, { front, back, learned: false });
    }

    setFront("");
    setBack("");
  }

  // Start editing a card
  function startEditingCard(card) {
    setEditingId(card.id);
    setNewFront(card.front);
    setNewBack(card.back);
  }

  // Confirm edit
  async function confirmEdit(cardId) {
    if (!newFront.trim() || !newBack.trim()) return;

    if (isDemo) {
      editDemoCard(id, {
        id: cardId,
        front: newFront,
        back: newBack,
        learned: false,
      });
      setCards((cs) =>
        cs.map((c) =>
          c.id === cardId ? { ...c, front: newFront, back: newBack } : c
        )
      );
    } else {
      const ref = doc(
        db,
        "users",
        currentUser.uid,
        "stacks",
        id,
        "cards",
        cardId
      );
      await updateDoc(ref, { front: newFront, back: newBack });
    }

    setEditingId(null);
    setNewFront("");
    setNewBack("");
  }

  // Cancel edit mode
  function cancelEdit() {
    setEditingId(null);
    setNewFront("");
    setNewBack("");
  }

  // Delete a card
  async function deleteCard(cardId) {
    if (isDemo) {
      deleteDemoCard(id, cardId);
    } else {
      const ref = doc(
        db,
        "users",
        currentUser.uid,
        "stacks",
        id,
        "cards",
        cardId
      );
      await deleteDoc(ref);
    }
  }

  // "Learn Unlearned":
  function onLearnUnlearned() {
    setLearningMode(MODES.UNLEARNED);
  }
  // zum Abbrechen:
  function onExitLearn() {
    setLearningMode(MODES.NONE);
  }

  return (
    <>
      {learningMode !== MODES.NONE ? (
        <LearnMode
          stackId={id}
          cards={cards}
          mode={learningMode}
          onExit={() => onExitLearn()}
        />
      ) : (
        <div className="container mx-auto mt-10">
          <h1 className="text-2xl font-bold mb-4">{stackName}</h1>
          {/* Stats */}
          <div className="flex items-center bg-white p-4 mb-6 gap-4 rounded shadow">
            <span className="text-lg font-semibold">Today:</span>
            <p className="text-sm font-medium">
              <span className="text-green-600">{learnedCards}</span> learned
              &amp; <span className="text-red-500">{unlearnedCards}</span>{" "}
              unlearned
            </p>
          </div>
          <div className="container flex items-center gap-4 mb-10">
            <button
              type="button"
              className="btn text-white"
              onClick={() => setShowConfirmLearnAll(true)}
            >
              Learn All Flashcards
            </button>
            <button
              type="button"
              className="btn text-white"
              onClick={onLearnUnlearned}
            >
              Learn Unlearned Flashcards
            </button>
          </div>

          {showConfirmLearnAll && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50">
              <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
                <p className="mb-4">
                  This resets all your progress. All flashcards will be marked
                  as unlearned. Continue?
                </p>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-red-500 text-white rounded"
                    onClick={() => setShowConfirmLearnAll(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-green-500 text-white rounded"
                    onClick={() => {
                      setLearningMode(MODES.ALL);
                      setShowConfirmLearnAll(false);
                    }}
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Flashcard Form */}
          <form
            onSubmit={handleAddCard}
            className="mb-8 bg-white p-6 rounded-lg shadow"
          >
            <h2 className="text-xl font-semibold mb-4">Create Flashcard</h2>

            <div className="mb-4">
              <label
                htmlFor="front"
                className="block font-medium text-gray-700 mb-1"
              >
                Front
              </label>
              <input
                id="front"
                type="text"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="back"
                className="block font-medium text-gray-700 mb-1"
              >
                Back
              </label>
              <input
                id="back"
                type="text"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              />
            </div>

            <button type="submit" className="btn w-full text-white">
              Create Flashcard
            </button>
          </form>
          {/* Cards Table */}
          {cards.length === 0 ? (
            <p className="text-gray-600 mb-20">No flashcards.</p>
          ) : (
            <table className="min-w-full bg-white rounded-lg shadow overflow-hidden table-auto mb-20">
              <thead className="bg-[var(--primary-color)]">
                <tr>
                  <th className="w-2/5 px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">
                    Front
                  </th>
                  <th className="w-2/5 px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">
                    Back
                  </th>
                  <th className="w-1/5 px-6 py-3 text-left text-sm font-semibold text-white uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card, idx) => (
                  <tr
                    key={card.id}
                    className={`${
                      idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } hover:bg-gray-100`}
                  >
                    {editingId === card.id ? (
                      <>
                        <td className="px-6 py-4">
                          <input
                            value={newFront}
                            onChange={(e) => setNewFront(e.target.value)}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            value={newBack}
                            onChange={(e) => setNewBack(e.target.value)}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => confirmEdit(card.id)}
                          >
                            <MdCheck className="text-green-600" size={24} />
                          </button>
                          <button type="button" onClick={cancelEdit}>
                            <MdClose className="text-red-600" size={24} />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-normal break-words">
                          {card.front}
                        </td>
                        <td className="px-6 py-4 whitespace-normal break-words">
                          {card.back}
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEditingCard(card)}
                          >
                            <MdEdit
                              className="text-[var(--primary-color)]"
                              size={24}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCard(card.id)}
                          >
                            <MdDelete
                              className="text-[var(--primary-color)]"
                              size={24}
                            />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
}
