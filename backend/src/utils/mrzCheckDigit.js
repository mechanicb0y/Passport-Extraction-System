const weights = [7, 3, 1];

export function getMrzCharacterValue(character) {
  if (character >= "0" && character <= "9") {
    return Number(character);
  }

  if (character >= "A" && character <= "Z") {
    return character.charCodeAt(0) - 55;
  }

  if (character === "<") {
    return 0;
  }

  return 0;
}

export function computeMrzCheckDigit(value = "") {
  const sum = value.split("").reduce((total, character, index) => {
    return total + getMrzCharacterValue(character) * weights[index % weights.length];
  }, 0);

  return String(sum % 10);
}

export function validateMrzCheckDigit(value = "", expected = "") {
  const actual = computeMrzCheckDigit(value);

  return {
    value,
    expected,
    actual,
    isValid: actual === expected
  };
}
