const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const SCALES = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

function readThreeDigits(threeDigits: number, isHighestTriplet: boolean): string[] {
  const hundred = Math.floor(threeDigits / 100);
  const remainder = threeDigits % 100;
  const ten = Math.floor(remainder / 10);
  const unit = remainder % 10;

  const result: string[] = [];

  // Hundred
  if (hundred > 0 || !isHighestTriplet) {
    result.push(DIGITS[hundred], 'trăm');
  }

  // Ten & Unit
  if (ten > 1) {
    result.push(DIGITS[ten], 'mươi');
    if (unit === 1) {
      result.push('mốt');
    } else if (unit === 5) {
      result.push('lăm');
    } else if (unit > 0) {
      result.push(DIGITS[unit]);
    }
  } else if (ten === 1) {
    result.push('mười');
    if (unit === 5) {
      result.push('lăm');
    } else if (unit > 0) {
      result.push(DIGITS[unit]);
    }
  } else if (ten === 0 && unit > 0) {
    if (hundred > 0 || !isHighestTriplet) {
      result.push('linh', DIGITS[unit]);
    } else {
      result.push(DIGITS[unit]);
    }
  }

  return result;
}

/**
 * Converts a numeric amount to Vietnamese words.
 * Example: 1500000 -> "Một triệu năm trăm nghìn đồng chẵn"
 */
export function numberToWordsVN(amount: number | string): string {
  const num = typeof amount === 'string' ? Math.floor(parseFloat(amount)) : Math.floor(amount);

  if (isNaN(num) || num === 0) {
    return 'Không đồng chẵn';
  }

  if (num < 0) {
    return 'Âm ' + numberToWordsVN(Math.abs(num)).toLowerCase();
  }

  let temp = num;
  const triplets: number[] = [];

  while (temp > 0) {
    triplets.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const words: string[] = [];

  for (let i = triplets.length - 1; i >= 0; i--) {
    const currentTriplet = triplets[i];
    if (currentTriplet > 0) {
      const isHighest = i === triplets.length - 1;
      const tripletWords = readThreeDigits(currentTriplet, isHighest);
      words.push(...tripletWords);
      if (SCALES[i]) {
        words.push(SCALES[i]);
      }
    }
  }

  if (words.length === 0) {
    return 'Không đồng chẵn';
  }

  const rawSentence = words.join(' ').replace(/\s+/g, ' ').trim();
  const capitalized = rawSentence.charAt(0).toUpperCase() + rawSentence.slice(1);

  return `${capitalized} đồng chẵn`;
}
