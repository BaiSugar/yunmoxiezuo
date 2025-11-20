/**
 * 文本自动排版工具
 */

/**
 * 标点符号映射表（英文 -> 中文）
 */
const punctuationMap: Record<string, string> = {
  ',': '，',
  '.': '。',
  '!': '！',
  '?': '？',
  ':': '：',
  ';': '；',
  '(': '（',
  ')': '）',
  '[': '【',
  ']': '】',
};

/**
 * 规范化标点符号（英文标点转中文）
 */
function normalizePunctuation(text: string): string {
  let result = text;
  
  // 替换英文标点为中文标点
  Object.entries(punctuationMap).forEach(([en, zh]) => {
    result = result.replace(new RegExp(`\\${en}`, 'g'), zh);
  });
  
  // 处理引号（成对替换）
  // 使用状态机方式逐个替换英文引号为中文引号
  let inDoubleQuote = false;
  result = result.split('').map(char => {
    if (char === '"') {
      inDoubleQuote = !inDoubleQuote;
      return inDoubleQuote ? '\u201c' : '\u201d';  // " 和 "
    }
    return char;
  }).join('');
  
  // 使用中文单引号
  let inSingleQuote = false;
  result = result.split('').map(char => {
    if (char === "'") {
      inSingleQuote = !inSingleQuote;
      return inSingleQuote ? '\u2018' : '\u2019';  // ' 和 '
    }
    return char;
  }).join('');
  
  return result;
}

/**
 * 处理中英文间空格
 */
function handleChineseEnglishSpacing(text: string): string {
  let result = text;
  
  // 中文后+英文前添加空格
  result = result.replace(/([\u4e00-\u9fa5])([a-zA-Z0-9])/g, '$1 $2');
  
  // 英文后+中文前添加空格
  result = result.replace(/([a-zA-Z0-9])([\u4e00-\u9fa5])/g, '$1 $2');
  
  // 清理多余空格（但不包括换行符）
  result = result.replace(/[ \t]+/g, ' ');
  
  return result;
}

/**
 * 自动换行处理（中文句号后自动换行）
 */
function handleLineBreaks(text: string): string {
  let result = text;
  
  // 在中文句号后添加换行，但有以下例外：
  // 1. 句号后面已经是换行符
  // 2. 句号在引号内（句号后面是右引号："、」、』、'）
  result = result.replace(/。(?!\n|[\u201d\u2019」』"])/g, '。\n');
  
  // 在右引号后如果是左引号（两段对话之间，有或无空格），也要换行
  result = result.replace(/([\u201d\u2019」』"])\s*([\u201c\u2018「『"])/g, '$1\n$2');
  
  // 将3个或以上连续换行替换为2个换行（保留一个空行）
  result = result.replace(/\n{3,}/g, '\n\n');
  
  return result;
}

/**
 * 清理多余空白字符
 */
function cleanWhitespace(text: string): string {
  let result = text;
  
  // 移除行首行尾空格（保留首行缩进）
  result = result.split('\n').map(line => {
    // 如果是首行缩进（4个空格），保留
    if (line.startsWith('    ')) {
      return '    ' + line.substring(4).trim();
    }
    return line.trim();
  }).join('\n');
  
  // 清理多个连续空行为最多一个空行
  result = result.replace(/\n\n\n+/g, '\n\n');
  
  return result;
}

/**
 * 执行完整的自动排版
 * 注意：首行缩进由CSS控制（text-indent: 2em），这里不添加空格
 */
export function autoFormat(text: string): string {
  if (!text || text.trim() === '') return text;
  
  let result = text;
  
  // 1. 规范化标点符号
  result = normalizePunctuation(result);
  
  // 2. 处理换行（中文句号后自动换行）
  result = handleLineBreaks(result);
  
  // 3. 处理中英文间空格
  result = handleChineseEnglishSpacing(result);
  
  // 4. 清理多余空白
  result = cleanWhitespace(result);
  
  // 注意：不再添加首行缩进空格，由CSS的text-indent控制
  
  return result;
}

/**
 * 移除所有格式（还原为纯文本）
 */
export function removeFormat(text: string): string {
  let result = text;
  
  // 移除首行缩进（4个空格或全角空格）
  result = result.replace(/^(    |　+)/gm, '');
  
  // 统一换行为单个换行
  result = result.replace(/\n+/g, '\n');
  
  return result.trim();
}
