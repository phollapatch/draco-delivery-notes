/**
 * Converts a number into Thai Baht text format (e.g. 2900 -> สองพันเก้าร้อยบาทถ้วน)
 */
export function bahttext(num: number): string {
  if (isNaN(num) || num === null) return "ศูนย์บาทถ้วน";
  
  // Round to 2 decimal places
  num = Math.round(num * 100) / 100;
  
  if (num === 0) return "ศูนย์บาทถ้วน";
  
  const textNumbers = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
  const textUnits = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  
  const parts = num.toString().split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1] || "";
  
  let result = "";
  
  // Process integer part
  if (integerPart && integerPart !== "0") {
    result += convertSection(integerPart, textNumbers, textUnits);
    result += "บาท";
  }
  
  // Process decimal part
  if (decimalPart && decimalPart !== "00" && parseInt(decimalPart) > 0) {
    let decimals = decimalPart;
    if (decimals.length === 1) decimals += "0"; // Handle single digit cents
    decimals = decimals.substring(0, 2); // Cap at 2 digits
    result += convertSection(decimals, textNumbers, textUnits);
    result += "สตางค์";
  } else {
    result += "ถ้วน";
  }
  
  return result;
}

function convertSection(numStr: string, textNumbers: string[], textUnits: string[]): string {
  let result = "";
  const len = numStr.length;
  
  // Handle millions grouping recursively if needed
  if (len > 6) {
    const millionPart = numStr.substring(0, len - 6);
    const restPart = numStr.substring(len - 6);
    
    result += convertSection(millionPart, textNumbers, textUnits) + "ล้าน";
    result += convertSection(restPart, textNumbers, textUnits);
    return result;
  }
  
  for (let i = 0; i < len; i++) {
    const digit = parseInt(numStr[i]);
    const pos = len - i - 1;
    
    if (digit !== 0) {
      if (pos === 1 && digit === 1) {
        // สิบ, not หนึ่งสิบ
        result += "สิบ";
      } else if (pos === 1 && digit === 2) {
        // ยี่สิบ, not สองสิบ
        result += "ยี่สิบ";
      } else if (pos === 0 && digit === 1 && len > 1) {
        // เอ็ด at the end
        result += "เอ็ด";
      } else {
        result += textNumbers[digit] + textUnits[pos];
      }
    }
  }
  
  return result;
}
