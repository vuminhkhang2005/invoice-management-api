import { numberToWordsVN } from '../../src/utils/numberToWordsVN.util';

describe('numberToWordsVN Utility Tests', () => {
  it('should convert 0 to "Không đồng chẵn"', () => {
    expect(numberToWordsVN(0)).toBe('Không đồng chẵn');
  });

  it('should convert simple thousands and millions', () => {
    expect(numberToWordsVN(1000)).toBe('Một nghìn đồng chẵn');
    expect(numberToWordsVN(1000000)).toBe('Một triệu đồng chẵn');
    expect(numberToWordsVN(1500000)).toBe('Một triệu năm trăm nghìn đồng chẵn');
  });

  it('should handle special Vietnamese numbers: 15, 21, 25, 105', () => {
    expect(numberToWordsVN(15)).toBe('Mười lăm đồng chẵn');
    expect(numberToWordsVN(21)).toBe('Hai mươi mốt đồng chẵn');
    expect(numberToWordsVN(25)).toBe('Hai mươi lăm đồng chẵn');
    expect(numberToWordsVN(105)).toBe('Một trăm linh năm đồng chẵn');
  });

  it('should handle large amounts (billions / tens of millions)', () => {
    expect(numberToWordsVN(35200000)).toBe(
      'Ba mươi lăm triệu hai trăm nghìn đồng chẵn'
    );
    expect(numberToWordsVN(1000000000)).toBe('Một tỷ đồng chẵn');
  });
});
