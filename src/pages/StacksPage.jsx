// src/pages/StacksPage.jsx
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { MdEdit, MdDelete, MdCheck, MdClose } from "react-icons/md";

export default function StacksPage() {
  const {
    currentUser,
    isDemo,
    demoStacks,
    addDemoStack,
    deleteDemoStack,
    editDemoStack,
  } = useAuth();
  const [stacks, setStacks] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState("");
  const [createStackName, setCreateStackName] = useState("");
  const navigate = useNavigate();

  // Load stacks (Demo vs. Firestore)
  useEffect(() => {
    if (isDemo) {
      setStacks(demoStacks);
      return;
    }
    if (!currentUser) return;
    const colRef = collection(db, "users", currentUser.uid, "stacks");
    const unsub = onSnapshot(colRef, (snap) => {
      setStacks(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [currentUser, isDemo, demoStacks]);

  function showFlashcards(stackId) {
    navigate(`/stacks/${stackId}`);
  }

  async function addStack() {
    if (!createStackName.trim()) return;
    if (isDemo) {
      addDemoStack(createStackName);
    } else {
      const colRef = collection(db, "users", currentUser.uid, "stacks");
      await addDoc(colRef, { name: createStackName });
    }
    setCreateStackName("");
  }

  // Start edit: prefill newName
  function startEditing(stack) {
    setEditingId(stack.id);
    setNewName(stack.name);
  }

  // Confirm edit
  async function confirmEdit(id) {
    if (!newName.trim()) return; // leeren Namen nicht speichern
    if (isDemo) {
      editDemoStack(id, newName);
    } else {
      // Firestore updaten
      const ref = doc(db, "users", currentUser.uid, "stacks", id);
      await updateDoc(ref, { name: newName });
    }
    setEditingId(null);
    setNewName("");
  }

  // Cancel edit
  function cancelEdit() {
    setEditingId(null);
    setNewName("");
  }

  // Delete stack
  async function deleteStack(stackId) {
    if (!confirm("Do you really want to delete this stack?")) return;
    if (isDemo) {
      deleteDemoStack(stackId);
    } else {
      const ref = doc(db, "users", currentUser.uid, "stacks", stackId);
      await deleteDoc(ref);
    }
  }

  return (
    <div className="container mx-auto mt-10">
      {/* Create Stack */}
      <div className="flex flex-col xs:flex-row xs:items-center gap-3 mb-10">
        <span className="text-xl">Create a stack: </span>
        <div className="flex items-center gap-3">
          <input
            type="text"
            className="px-2 py-1 border border-gray-300 rounded-[6px] bg-white 
          text-gray-900 placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
            placeholder="Stackname"
            value={createStackName}
            onChange={(e) => setCreateStackName(e.target.value)}
          />
          <button
            type="button"
            onClick={addStack}
            className="border-1 rounded-[5px] bg-[var(--primary-color)] cursor-pointer text-white px-3 py-1"
          >
            Create
          </button>
        </div>
      </div>

      {/* List of Stacks */}
      <h1 className="font-bold mb-4">Your Stacks</h1>
      <ul className="space-y-4">
        {stacks.map((s) => (
          <li
            key={s.id}
            className="bg-white p-4 rounded shadow flex flex-col gap-3 xs:flex-row justify-between xs:items-center"
          >
            {editingId === s.id ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  className="flex-1 border px-2 py-1 rounded"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <button type="button" onClick={() => confirmEdit(s.id)}>
                  <MdCheck size={24} className="text-green-600" />
                </button>
                <button type="button" onClick={cancelEdit}>
                  <MdClose size={24} className="text-red-600" />
                </button>
              </div>
            ) : (
              <>
                <h3>{s.name}</h3>
                <div className="flex items-center gap-5">
                  <button
                    type="button"
                    className="btn text-white"
                    onClick={() => showFlashcards(s.id)}
                  >
                    Show Flashcards
                  </button>
                  <button type="button" onClick={() => startEditing(s)}>
                    <MdEdit size={34} className="text-[var(--primary-color)]" />
                  </button>
                  <button type="button" onClick={() => deleteStack(s.id)}>
                    <MdDelete
                      size={34}
                      className="text-[var(--primary-color)]"
                    />
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
