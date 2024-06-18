import { atom } from "jotai";

const textAtom = atom("hello");
export const textUpperCaseAtom = atom(
  (get) => get(textAtom).toUpperCase(),
  (_get, set, newText: string) => set(textAtom, newText)
);
