// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

const AuthContext = createContext();

// Hook für einfachen Zugriff
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  // Vordefinierte Daten für den Demo-Modus
  const initialDemos = [
    {
      id: "1",
      name: "English Vocabulary",
      cards: [
        { id: "1", front: "Haus", back: "House", learned: false },
        { id: "2", front: "Baum", back: "Tree", learned: false },
        { id: "3", front: "Auto", back: "Car", learned: false },
        { id: "4", front: "Schlange", back: "Snake", learned: false },
      ],
    },
    {
      id: "2",
      name: "Math Basics",
      cards: [
        { id: "1", front: "2 + 2", back: "4", learned: false },
        { id: "2", front: "3 * 3", back: "9", learned: false },
        { id: "3", front: "9 / 3", back: "3", learned: false },
        { id: "4", front: "10 + 5", back: "15", learned: false },
      ],
    },
  ];

  const [demoStacks, setDemoStacks] = useState(initialDemos);

  function addDemoStack(name) {
    setDemoStacks((stacks) => {
      // 1) Bestehende IDs in Zahlen umwandeln
      const nums = stacks.map((s) => parseInt(s.id, 10));
      // 2) Höchste ID finden (falls keine da ist, 0)
      const maxId = nums.length > 0 ? Math.max(...nums) : 0;

      return [
        ...stacks,
        {
          id: String(maxId + 1),
          name,
          cards: [],
        },
      ];
    });
  }

  function deleteDemoStack(stackId) {
    setDemoStacks((stacks) => stacks.filter((stack) => stack.id !== stackId));
  }

  function addDemoCard(stackId, front, back) {
    setDemoStacks((stacks) =>
      stacks.map((stack) => {
        if (stack.id !== stackId) return stack;

        // 1) Alle existierenden Karten-IDs in Numbers umwandeln
        const nums = stack.cards.map((c) => parseInt(c.id, 10) || 0);

        // 2) Höchste ID finden (0, wenn keine Karten da sind)
        const maxId = nums.length > 0 ? Math.max(...nums) : 0;

        // 3) Neue ID als String (max+1)
        const newId = String(maxId + 1);

        // 4) Neue Karte zusammenbauen
        const newCard = { id: newId, front, back, learned: false };

        return {
          ...stack,
          cards: [...stack.cards, newCard],
        };
      })
    );
  }

  function editDemoCard(stackId, editedCard) {
    setDemoStacks((stacks) =>
      stacks.map((s) =>
        s.id === stackId
          ? {
              ...s,
              cards: s.cards.map((c) =>
                c.id === editedCard.id ? editedCard : c
              ),
            }
          : s
      )
    );
  }

  function deleteDemoCard(stackId, deletedCardId) {
    setDemoStacks((stacks) =>
      stacks.map((stack) =>
        stack.id === stackId
          ? {
              ...stack,
              cards: stack.cards.filter((card) => card.id !== deletedCardId),
            }
          : stack
      )
    );
  }

  function editDemoStack(stackId, newName) {
    setDemoStacks((stacks) =>
      stacks.map((stack) =>
        stack.id === stackId ? { ...stack, name: newName } : stack
      )
    );
  }

  // Listener für Login/Logout
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Auth-Funktionen
  const signup = (email, pw) => createUserWithEmailAndPassword(auth, email, pw);
  const login = (email, pw) => signInWithEmailAndPassword(auth, email, pw);
  const logout = () => {
    setIsDemo(false);
    return signOut(auth);
  };

  const loginAsDemo = () => {
    setIsDemo(true);
    setLoading(false);
  };

  const value = {
    currentUser,
    isDemo,
    demoStacks,
    signup,
    login,
    logout,
    loginAsDemo,
    addDemoStack,
    deleteDemoStack,
    editDemoStack,
    addDemoCard,
    editDemoCard,
    deleteDemoCard,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
