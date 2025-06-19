// src/pages/LearnMode.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { GiPartyPopper } from "react-icons/gi";

export default function LearnMode({ stackId, cards, mode, onExit }) {
  const { currentUser, isDemo, editDemoCard } = useAuth();
  const navigate = useNavigate();

  const [queue, setQueue] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // einmalige Initialisierung von queue + optional DB-Reset
  useEffect(() => {
    if (!cards.length) return; // warte auf Karten
    if (queue !== null) return; // nur einmal initialisieren

    // 1) baue initialen queue-Array
    let initial;
    if (mode === "all") {
      initial = cards.map((c) => ({ ...c, learned: false }));
    } else {
      initial = cards.filter((c) => !c.learned);
    }
    setQueue(initial);
    setShowAnswer(false);

    // 2) und führe im „all“-Modus erst das DB-Reset durch
    if (mode === "all") {
      (async () => {
        if (isDemo) {
          initial.forEach((c) =>
            editDemoCard(stackId, { ...c, learned: false })
          );
        } else {
          await Promise.all(
            initial.map((c) =>
              updateDoc(
                doc(
                  db,
                  "users",
                  currentUser.uid,
                  "stacks",
                  stackId,
                  "cards",
                  c.id
                ),
                { learned: false }
              )
            )
          );
        }
      })();
    }
  }, [cards, mode, queue, isDemo, editDemoCard, currentUser, stackId]);

  // falls noch gar nicht initialisiert:
  if (queue === null) {
    return (
      <div className="p-8 text-center">
        There are no flashcards in this Stack.
      </div>
    );
  }

  // wenn fertig:
  if (queue.length === 0) {
    return (
      <div className="flex flex-col mt-20 items-center gap-5 justify-center">
        <GiPartyPopper size={80} className="text-[var(--primary-color)]" />
        <h2>Congratulations! You have learned all cards.</h2>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="btn text-white"
        >
          Go back
        </button>
      </div>
    );
  }

  // User-Aktionen
  const current = queue[0];
  async function handleKnow() {
    if (isDemo) {
      editDemoCard(stackId, { ...current, learned: true });
    } else {
      await updateDoc(
        doc(
          db,
          "users",
          currentUser.uid,
          "stacks",
          stackId,
          "cards",
          current.id
        ),
        { learned: true }
      );
    }
    setQueue((q) => q.slice(1));
    setShowAnswer(false);
  }
  function handleDontKnow() {
    setQueue((q) => [...q.slice(1), q[0]]);
    setShowAnswer(false);
  }
  function stop() {
    onExit();
  }

  // Render
  return (
    <div className="max-w-md mx-auto mt-12 p-8 bg-white rounded-xl shadow-lg flex flex-col items-center space-y-6">
      <div className="flex items-center gap-10">
        <p className="text-gray-700 text-sm">
          {queue.length} {queue.length === 1 ? "card" : "cards"} remain
        </p>
        <button
          type="button"
          onClick={stop}
          className="text-red-500 cursor-pointer hover:underline px-3 py-1 rounded transition"
        >
          Stop Learning
        </button>
      </div>

      <div className="w-full">
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <h3 className="text-2xl font-semibold">{current.front}</h3>
        </div>

        {!showAnswer ? (
          <button
            type="button"
            onClick={() => setShowAnswer(true)}
            className="btn w-full text-white mt-6"
          >
            Show Answer
          </button>
        ) : (
          <>
            <div className="bg-gray-50 p-6 rounded-lg text-center mt-6">
              <h3 className="text-2xl font-semibold">{current.back}</h3>
            </div>
            <div className="mt-6 flex w-full gap-4">
              <button
                type="button"
                onClick={handleKnow}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition"
              >
                I know this
              </button>
              <button
                type="button"
                onClick={handleDontKnow}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition"
              >
                Repeat
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
