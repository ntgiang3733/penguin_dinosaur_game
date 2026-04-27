const cache = new Map();

/**
 * Validate if a word is a real English word using Free Dictionary API
 * Results are cached to avoid redundant API calls
 */
export async function validateWord(word) {
  const lowerWord = word.toLowerCase().trim();

  if (lowerWord.length < 2) {
    return { valid: false, reason: "Từ phải có ít nhất 2 ký tự" };
  }

  if (!/^[a-zA-Z]+$/.test(lowerWord)) {
    return { valid: false, reason: "Từ chỉ được chứa các chữ cái tiếng Anh" };
  }

  if (cache.has(lowerWord)) {
    return cache.get(lowerWord);
  }

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${lowerWord}`
    );

    if (response.ok) {
      const result = { valid: true, reason: null };
      cache.set(lowerWord, result);
      return result;
    } else if (response.status === 404) {
      const result = { valid: false, reason: `"${word}" không phải là từ tiếng Anh hợp lệ` };
      cache.set(lowerWord, result);
      return result;
    } else {
      return { valid: false, reason: "Lỗi khi kiểm tra từ. Vui lòng thử lại." };
    }
  } catch (error) {
    console.error("Dictionary API error:", error);
    return { valid: false, reason: "Không thể kết nối tới server kiểm tra từ" };
  }
}

/**
 * Check if the word follows the chain rule
 */
export function checkChainRule(newWord, lastWord) {
  if (!lastWord) return { valid: true };

  const lastChar = lastWord.charAt(lastWord.length - 1).toLowerCase();
  const firstChar = newWord.charAt(0).toLowerCase();

  if (firstChar !== lastChar) {
    return {
      valid: false,
      reason: `Từ phải bắt đầu bằng chữ "${lastChar.toUpperCase()}"`,
    };
  }

  return { valid: true };
}

/**
 * Check if the word has already been used in this game
 */
export function checkDuplicate(word, usedWords) {
  const lowerWord = word.toLowerCase().trim();
  if (usedWords.map((w) => w.toLowerCase()).includes(lowerWord)) {
    return { valid: false, reason: `"${word}" đã được sử dụng trong game này` };
  }
  return { valid: true };
}
