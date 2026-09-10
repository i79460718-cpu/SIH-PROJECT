import { en } from "./en";
import { hi } from "./hi";
import { nag } from "./nag";
import { kho } from "./kho";
import { kru } from "./kru";
import { mun } from "./mun";
import { sat } from "./sat";
import { ho } from "./ho";
import { bn } from "./bn";
import type { Language } from "../language-context";

export const DICTIONARY: Record<Exclude<Language, "auto">, Record<string, string>> = {
  en,
  hi,
  nag,
  kho,
  kru,
  mun,
  sat,
  ho,
  bn
};
