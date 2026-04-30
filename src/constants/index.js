export const WIN_PONT = 50;
export const TIME_PER_TURN = 30;

const LETTER_POOL = "ABCDEGHILMNOPRSTUW";

export const RULE_DEFS = {
  chain: {
    label: "Nối chữ",
    desc: "Từ mới phải bắt đầu bằng chữ cái cuối của từ trước",
    needsLetter: false,
  },
  min_length: {
    label: "Tối thiểu 5 ký tự",
    desc: "Mỗi từ phải có ít nhất 5 ký tự",
    needsLetter: false,
    minLength: 5,
  },
  start_with: {
    label: "Bắt đầu bằng chữ...",
    desc: 'Mọi từ phải bắt đầu bằng chữ "{letter}"',
    needsLetter: true,
  },
  end_with: {
    label: "Kết thúc bằng chữ...",
    desc: 'Mọi từ phải kết thúc bằng chữ "{letter}"',
    needsLetter: true,
  },
};

function randomLetter() {
  return LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)];
}

/** Pick a random rule for a new game */
export function pickRandomRule() {
  const types = Object.keys(RULE_DEFS);
  const type = types[Math.floor(Math.random() * types.length)];
  const def = RULE_DEFS[type];
  const rule = { type };
  if (def.needsLetter) {
    rule.letter = randomLetter();
  }
  return rule;
}

/** Get human-readable description for the active rule */
export function getRuleDescription(rule) {
  if (!rule) return RULE_DEFS.chain.desc;
  const def = RULE_DEFS[rule.type];
  if (!def) return RULE_DEFS.chain.desc;
  return def.desc.replace("{letter}", rule.letter || "?");
}
