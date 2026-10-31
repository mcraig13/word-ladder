import { normaliseWord } from "../../src/core/normaliseWord";

/**
 * Turns one SCOWL Hunspell dictionary (its .aff and .dic text) into a clean
 * word list (chunk 6.1a, D17): every form the endings make, lowercase a–z
 * only, without Roman numerals, excluded words, taboo words or blocked words.
 *
 * Only the Hunspell features SCOWL's en_GB files use are supported. Anything
 * else is reported with its line, so a new release can't drop words quietly.
 */
export interface HunspellFiles {
  affixText: string;
  dictionaryText: string;
  /** One word per line, any case; blank lines and `#` comments are skipped. */
  exclusionListText: string;
  /** Same format as the exclusion list. */
  blocklistText: string;
}

export type HunspellFile = "affix" | "dictionary" | "exclusion" | "blocklist";

export type GetWordsFromHunspellResult =
  | { ok: true; words: readonly string[] }
  | {
      ok: false;
      reason: "unsupported-line" | "unknown-flag" | "invalid-word";
      file: HunspellFile;
      lineNumber: number;
    };

type Failure = Extract<GetWordsFromHunspellResult, { ok: false }>;

type AffixKind = "PFX" | "SFX";

interface AffixRule {
  kind: AffixKind;
  /** Letters removed from the end of the word first; "" for none. */
  strip: string;
  add: string;
  condition: RegExp;
  canCombine: boolean;
}

interface AffixFile {
  rulesByFlag: Map<string, AffixRule[]>;
  /** The flag SCOWL puts on taboo words, or "" if the file names none. */
  tabooFlag: string;
}

interface AffixGroup {
  kind: AffixKind;
  flag: string;
  canCombine: boolean;
  rules: AffixRule[];
  rulesLeft: number;
  headerLineNumber: number;
}

// Every line is trimmed, which also removes the "\r" of a Windows line ending.
const LINE_BREAK = "\n";
const WHOLE_NUMBER = /^\d+$/;
const ASCII_LETTERS = /^[a-z]+$/i;

// Directives that affect only spelling suggestions, input conversion, how text
// is split into words, or compound words. SCOWL's compound rules join number
// entries only (`1st/p`), whose words all contain digits (6.1a intent, choice 3).
const IGNORED_DIRECTIVES = new Set([
  "TRY",
  "REP",
  "ICONV",
  "WORDCHARS",
  "COMPOUNDMIN",
  "ONLYINCOMPOUND",
  "COMPOUNDRULE",
]);

// A condition is a sequence of `.`, a letter or apostrophe, `[...]` or
// `[^...]`. Those mean the same in a regular expression, so a condition that
// matches this is used as one directly.
const CONDITION = String.raw`(?:\.|[a-z']|\[\^?[a-z']+\])+`;
const AFFIX_HEADER = /^[PS]FX \S [YN] \d+$/;
const AFFIX_RULE = new RegExp(String.raw`^[PS]FX \S (?:0|[a-z]+) [a-z']+ ${CONDITION}$`);

// Standard-form Roman numerals, from i to mmmcmxcix (6.1a intent, choice 6).
const ROMAN_NUMERAL = /^m{0,3}(?:cm|cd|d?c{0,3})(?:xc|xl|l?x{0,3})(?:ix|iv|v?i{0,3})$/;
// Real words that are also Roman numerals, kept by decision at the 6.1a review.
const REAL_WORDS_THAT_ARE_ROMAN_NUMERALS = new Set(["mix"]);

export function getWordsFromHunspell(files: HunspellFiles): GetWordsFromHunspellResult {
  const affixFile = readAffixFile(files.affixText);
  if ("ok" in affixFile) {
    return affixFile;
  }

  const excludedWords = readWordList(files.exclusionListText, "exclusion");
  if ("ok" in excludedWords) {
    return excludedWords;
  }

  const blockedWords = readWordList(files.blocklistText, "blocklist");
  if ("ok" in blockedWords) {
    return blockedWords;
  }

  // Splitting always gives at least one line.
  const [countLine, ...entryLines] = files.dictionaryText.split(LINE_BREAK) as [
    string,
    ...string[],
  ];
  if (!WHOLE_NUMBER.test(countLine.trim())) {
    return failure("unsupported-line", "dictionary", 1);
  }

  const keptWords = new Set<string>();
  const tabooWords = new Set<string>();

  for (const [index, line] of entryLines.entries()) {
    const entry = line.trim();
    const lineNumber = index + 2;
    if (entry === "") {
      continue;
    }
    if (/\s/.test(entry)) {
      return failure("unsupported-line", "dictionary", lineNumber);
    }

    const slashPosition = entry.indexOf("/");
    const word = slashPosition === -1 ? entry : entry.slice(0, slashPosition);
    // Each flag is one character (no FLAG line, intent choice 3).
    const flags = slashPosition === -1 ? [] : entry.slice(slashPosition + 1).split("");

    // Every form of a word with a non-letter keeps it, so the entry goes whole.
    if (!ASCII_LETTERS.test(word)) {
      continue;
    }

    const hasUnknownFlag = flags.some(
      (flag) => flag !== affixFile.tabooFlag && !affixFile.rulesByFlag.has(flag),
    );
    if (hasUnknownFlag) {
      return failure("unknown-flag", "dictionary", lineNumber);
    }

    const isTaboo = flags.includes(affixFile.tabooFlag);
    for (const form of getFormsOfEntry(word, flags, affixFile.rulesByFlag)) {
      if (isTaboo) {
        // Lowercased, so a capitalised taboo entry also drops its lowercase twin.
        tabooWords.add(form.toLowerCase());
      } else if (
        isLowercaseWord(form) &&
        !isRomanNumeral(form) &&
        !excludedWords.has(form) &&
        !blockedWords.has(form)
      ) {
        keptWords.add(form);
      }
    }
  }

  // A taboo form goes even when a clean entry also makes it (intent, choice 7).
  // Default sort, as in createDictionaryFromWords: the same order everywhere.
  const words = [...keptWords].filter((word) => !tabooWords.has(word)).sort();
  return { ok: true, words };
}

function readAffixFile(affixText: string): AffixFile | Failure {
  const rulesByFlag = new Map<string, AffixRule[]>();
  let tabooFlag = "";
  let openGroup: AffixGroup | undefined;

  for (const { text, lineNumber } of readLines(affixText)) {
    const fields = text.split(/\s+/);
    const line = fields.join(" ");

    // While a group is open, every line must be one of its rules.
    if (openGroup !== undefined) {
      const [kind, flag, strip, add, condition] = fields as [
        string,
        string,
        string,
        string,
        string,
      ];
      const isRuleOfOpenGroup =
        AFFIX_RULE.test(line) && kind === openGroup.kind && flag === openGroup.flag;
      if (!isRuleOfOpenGroup || (kind === "PFX" && strip !== "0")) {
        return failure("unsupported-line", "affix", lineNumber);
      }
      openGroup.rules.push({
        kind: openGroup.kind,
        strip: strip === "0" ? "" : strip,
        add,
        condition: new RegExp(kind === "PFX" ? `^${condition}` : `${condition}$`),
        canCombine: openGroup.canCombine,
      });
      openGroup.rulesLeft -= 1;
      if (openGroup.rulesLeft === 0) {
        openGroup = undefined;
      }
      continue;
    }

    const [directive, ...values] = fields as [string, ...string[]];
    const value = values.join(" ");
    if (IGNORED_DIRECTIVES.has(directive)) {
      continue;
    }
    if (directive === "SET" && value === "UTF-8") {
      continue;
    }
    if (directive === "NOSUGGEST" && value.length === 1) {
      tabooFlag = value;
      continue;
    }
    const [flag, crossProduct, count] = values as [string, string, string];
    // A second group for a flag would replace the first one's rules.
    if (!AFFIX_HEADER.test(line) || rulesByFlag.has(flag)) {
      return failure("unsupported-line", "affix", lineNumber);
    }

    const rules: AffixRule[] = [];
    rulesByFlag.set(flag, rules);
    openGroup = {
      kind: directive as AffixKind,
      flag,
      canCombine: crossProduct === "Y",
      rules,
      rulesLeft: Number(count),
      headerLineNumber: lineNumber,
    };
  }

  if (openGroup !== undefined) {
    return failure("unsupported-line", "affix", openGroup.headerLineNumber);
  }
  return { rulesByFlag, tabooFlag };
}

function readWordList(listText: string, file: HunspellFile): Set<string> | Failure {
  const words = new Set<string>();
  for (const { text, lineNumber } of readLines(listText)) {
    const normalised = normaliseWord(text);
    if (!normalised.ok) {
      return failure("invalid-word", file, lineNumber);
    }
    words.add(normalised.word);
  }
  return words;
}

/** The word, each prefix and suffix form, and each prefix added to a suffix form. */
function getFormsOfEntry(
  word: string,
  flags: readonly string[],
  rulesByFlag: Map<string, AffixRule[]>,
): string[] {
  const rules = flags.flatMap((flag) => rulesByFlag.get(flag) ?? []);
  const prefixRules = rules.filter((rule) => rule.kind === "PFX");
  const suffixForms = rules
    .filter((rule) => rule.kind === "SFX")
    .flatMap((rule) => addAffix(rule, word).map((form) => ({ form, rule })));

  const forms = [word, ...suffixForms.map(({ form }) => form)];
  for (const prefixRule of prefixRules) {
    forms.push(...addAffix(prefixRule, word));
    for (const { form, rule } of suffixForms) {
      if (prefixRule.canCombine && rule.canCombine) {
        forms.push(...addAffix(prefixRule, form));
      }
    }
  }
  return forms;
}

/** The word with the affix added, or nothing if the rule doesn't apply to it. */
function addAffix(rule: AffixRule, word: string): string[] {
  // Without FULLSTRIP, Hunspell never strips the whole word.
  const canApply =
    rule.condition.test(word) && word.endsWith(rule.strip) && word.length > rule.strip.length;
  if (!canApply) {
    return [];
  }
  return rule.kind === "PFX"
    ? [rule.add + word]
    : [word.slice(0, word.length - rule.strip.length) + rule.add];
}

function isLowercaseWord(form: string): boolean {
  const normalised = normaliseWord(form);
  return normalised.ok && normalised.word === form;
}

function isRomanNumeral(form: string): boolean {
  return ROMAN_NUMERAL.test(form) && !REAL_WORDS_THAT_ARE_ROMAN_NUMERALS.has(form);
}

/** Trimmed lines, numbered from 1, without blank lines or `#` comments. */
function readLines(text: string): { text: string; lineNumber: number }[] {
  return text
    .split(LINE_BREAK)
    .map((line, index) => ({ text: line.trim(), lineNumber: index + 1 }))
    .filter((line) => line.text !== "" && !line.text.startsWith("#"));
}

function failure(reason: Failure["reason"], file: HunspellFile, lineNumber: number): Failure {
  return { ok: false, reason, file, lineNumber };
}
