(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('cs-code-editor');
    const languageSelect = document.getElementById('select-cs-language');
    const suggestionList = document.getElementById('cs-editor-suggestions');
    const statusBar = document.querySelector('.cs-editor-status');
    const statusText = document.getElementById('cs-editor-check-status');
    const checkButton = document.getElementById('btn-cs-check-code');
    const diagnosticsPane = document.getElementById('pane-dock-errors');
    const lineNumbers = document.getElementById('cs-line-numbers');
    if (!editor || !languageSelect || !suggestionList || !statusBar || !statusText) return;

    const completions = {
      javascript: [
        ['const', 'Declare a constant'], ['let', 'Declare a variable'], ['function', 'Function declaration'],
        ['if', 'Conditional statement'], ['for', 'For loop'], ['while', 'While loop'], ['return', 'Return a value'],
        ['console.log', 'Write to the console'], ['document.querySelector', 'Select a page element'],
        ['addEventListener', 'Listen for an event'], ['async', 'Declare an async function'], ['await', 'Wait for a promise'],
        ['try…catch', 'Handle an exception'], ['map', 'Transform array items'], ['filter', 'Filter array items']
      ],
      python: [
        ['def', 'Define a function'], ['class', 'Define a class'], ['if', 'Conditional statement'],
        ['elif', 'Additional condition'], ['else', 'Fallback branch'], ['for', 'For loop'],
        ['while', 'While loop'], ['return', 'Return a value'], ['import', 'Import a module'],
        ['print', 'Write to the console'], ['range', 'Generate a number sequence'],
        ['enumerate', 'Iterate with indexes'], ['try…except', 'Handle an exception'], ['with', 'Context manager']
      ],
      html: [
        ['div', 'Generic container'], ['section', 'Thematic section'], ['main', 'Main page content'],
        ['header', 'Page or section header'], ['button', 'Interactive button'], ['form', 'Form element'],
        ['input', 'Form input'], ['label', 'Form label'], ['a', 'Link'], ['img', 'Image']
      ],
      css: [
        ['display', 'Element display mode'], ['flex', 'Flexible box layout'], ['grid', 'Grid layout'],
        ['color', 'Text color'], ['background', 'Background styling'], ['margin', 'Outer spacing'],
        ['padding', 'Inner spacing'], ['position', 'Positioning mode'], ['border-radius', 'Rounded corners'],
        ['media', 'Responsive media query']
      ],
      sql: [
        ['SELECT', 'Read rows'], ['FROM', 'Choose a table'], ['WHERE', 'Filter rows'],
        ['JOIN', 'Combine tables'], ['ON', 'Set join conditions'], ['ORDER BY', 'Sort rows'],
        ['GROUP BY', 'Group rows'], ['INSERT INTO', 'Insert rows'], ['UPDATE', 'Update rows'],
        ['CREATE TABLE', 'Create a table'], ['LIMIT', 'Limit result count']
      ],
      c: [
        ['#include', 'Include a header'], ['int', 'Integer type'], ['char', 'Character type'],
        ['float', 'Floating-point type'], ['double', 'Double-precision type'], ['if', 'Conditional statement'],
        ['for', 'For loop'], ['while', 'While loop'], ['printf', 'Formatted output'], ['main', 'Program entry point']
      ],
      cpp: [
        ['#include', 'Include a header'], ['int', 'Integer type'], ['std::cout', 'Write to standard output'],
        ['std::vector', 'Dynamic array'], ['std::string', 'Text type'], ['if', 'Conditional statement'],
        ['for', 'For loop'], ['while', 'While loop'], ['class', 'Define a class'], ['return', 'Return a value']
      ],
      java: [
        ['public', 'Public access modifier'], ['private', 'Private access modifier'], ['class', 'Define a class'],
        ['static', 'Static member'], ['void', 'No return value'], ['int', 'Integer type'],
        ['String', 'Text type'], ['if', 'Conditional statement'], ['for', 'For loop'],
        ['System.out.println', 'Write a line to the console'], ['return', 'Return a value']
      ]
    };

    const snippets = {
      javascript: {
        function: 'function name() {\n    \n}',
        'console.log': 'console.log();',
        'try…catch': 'try {\n    \n} catch (error) {\n    console.error(error);\n}'
      },
      python: {
        def: 'def function_name():\n    ',
        class: 'class ClassName:\n    def __init__(self):\n        ',
        'try…except': 'try:\n    \nexcept Exception as error:\n    print(error)'
      },
      html: {
        div: '<div>\n    \n</div>',
        section: '<section>\n    \n</section>',
        button: '<button type="button"></button>',
        form: '<form>\n    \n</form>'
      },
      css: {
        media: '@media (max-width: 768px) {\n    \n}'
      },
      sql: {
        SELECT: 'SELECT columns\nFROM table_name\nWHERE condition;',
        'CREATE TABLE': 'CREATE TABLE table_name (\n    id INTEGER PRIMARY KEY\n);'
      },
      c: {
        main: 'int main(void) {\n    \n    return 0;\n}',
        printf: 'printf("");'
      },
      cpp: {
        main: 'int main() {\n    \n    return 0;\n}',
        'std::cout': 'std::cout << "" << std::endl;'
      },
      java: {
        class: 'public class ClassName {\n    public static void main(String[] args) {\n        \n    }\n}',
        'System.out.println': 'System.out.println("");'
      }
    };

    const corrections = {
      javascript: { funtion: 'function', fucntion: 'function', cosnt: 'const', retrun: 'return', consle: 'console' },
      python: { pritn: 'print', pimort: 'import', improt: 'import', retrun: 'return', flase: 'False', ture: 'True' },
      sql: { selec: 'SELECT', form: 'FROM', wher: 'WHERE', oder: 'ORDER' },
      c: { pritnf: 'printf', retrun: 'return', incldue: 'include' },
      cpp: { retrun: 'return', incldue: 'include', coutt: 'cout' },
      java: { retrun: 'return', systen: 'System', stactic: 'static' },
      html: { buton: 'button', imput: 'input', clas: 'class', scr: 'src' },
      css: { backgroud: 'background', margn: 'margin', paddng: 'padding', disply: 'display' }
    };

    const words = {
      javascript: ['const', 'let', 'var', 'function', 'class', 'if', 'else', 'for', 'while', 'return', 'new', 'this', 'try', 'catch', 'throw', 'async', 'await', 'import', 'export', 'true', 'false', 'null', 'undefined'],
      python: ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'with', 'lambda', 'pass', 'break', 'continue', 'True', 'False', 'None', 'and', 'or', 'not'],
      html: ['div', 'span', 'main', 'section', 'header', 'footer', 'button', 'form', 'input', 'label', 'script', 'style', 'html', 'body'],
      css: ['display', 'flex', 'grid', 'color', 'background', 'margin', 'padding', 'border', 'position', 'width', 'height', 'font-size', 'gap'],
      sql: ['SELECT', 'FROM', 'WHERE', 'JOIN', 'ON', 'AS', 'AND', 'OR', 'ORDER', 'BY', 'GROUP', 'LIMIT', 'INSERT', 'INTO', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE'],
      c: ['int', 'char', 'float', 'double', 'void', 'if', 'else', 'for', 'while', 'return', 'struct', 'typedef', 'include', 'printf', 'sizeof'],
      cpp: ['int', 'char', 'float', 'double', 'void', 'if', 'else', 'for', 'while', 'return', 'class', 'public', 'private', 'namespace', 'include', 'std', 'cout', 'endl'],
      java: ['public', 'private', 'protected', 'class', 'static', 'void', 'int', 'double', 'boolean', 'String', 'if', 'else', 'for', 'while', 'return', 'new', 'try', 'catch', 'import']
    };

    const builtins = {
      javascript: new Set(('Array Object String Number Boolean Math Date JSON Promise Set Map Error RegExp console window document parseInt parseFloat isNaN Infinity NaN undefined null true false require module exports process Buffer setTimeout setInterval clearTimeout fetch').split(' ')),
      python: new Set(('print len range enumerate zip map filter sorted reversed sum min max abs round str int float bool list dict set tuple type isinstance hasattr getattr setattr super property object Exception ValueError TypeError RuntimeError open input help id dir hash iter next any all pow divmod slice chr ord bin hex oct format repr vars globals locals self True False None').split(' ')),
      c: new Set(('printf scanf fprintf sprintf puts putchar getchar malloc calloc realloc free sizeof strlen strcpy strcmp strcat fopen fclose fread fwrite perror exit main NULL EOF stdin stdout stderr').split(' ')),
      cpp: new Set(('printf scanf cout cin cerr endl string vector map set unordered_map unordered_set queue stack pair sort find max min abs sqrt pow size_t nullptr true false').split(' ')),
      java: new Set(('System String Integer Double Boolean Math Object Exception RuntimeException ArrayList List Map Set Scanner StringBuilder Thread Override Deprecated').split(' '))
    };

    let suggestions = [];
    let selectedSuggestion = 0;
    let checkTimer = 0;

    function currentLanguage() {
      return languageSelect.value || 'javascript';
    }

    function setStatus(message, state) {
      statusText.textContent = message;
      statusBar.dataset.state = state || 'neutral';
    }

    function currentPrefix() {
      const before = editor.value.slice(0, editor.selectionStart);
      const match = before.match(/[A-Za-z_$][\w$]*$/);
      return match ? { word: match[0], start: editor.selectionStart - match[0].length } : { word: '', start: editor.selectionStart };
    }

    function positionSuggestions() {
      const prefix = currentPrefix();
      const lineIndex = editor.value.slice(0, editor.selectionStart).split('\n').length - 1;
      const lineHeight = parseFloat(getComputedStyle(editor).lineHeight) || 20;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      context.font = getComputedStyle(editor).font;
      const beforeLine = editor.value.slice(0, editor.selectionStart).split('\n').pop() || '';
      const textWidth = context.measureText(beforeLine).width;
      const left = Math.max(52, Math.min(editor.clientWidth - 320, 58 + textWidth - editor.scrollLeft));
      const top = Math.max(4, Math.min(editor.clientHeight - 230, 12 + ((lineIndex + 1) * lineHeight) - editor.scrollTop));
      suggestionList.style.left = `${left}px`;
      suggestionList.style.top = `${top}px`;
      suggestionList.dataset.prefixStart = String(prefix.start);
    }

    function hideSuggestions() {
      suggestionList.hidden = true;
      editor.setAttribute('aria-expanded', 'false');
      suggestionList.replaceChildren();
      suggestions = [];
      selectedSuggestion = 0;
    }

    function matchesCompletion(label, prefix, language, force) {
      if (force && !prefix.word) return true;
      const normalizedPrefix = prefix.word.toLowerCase();
      const normalizedLabel = label.toLowerCase();
      if (normalizedLabel.startsWith(normalizedPrefix)) return true;
      const finalSegment = normalizedLabel.split(/[.:]/).pop();
      if (finalSegment.startsWith(normalizedPrefix)) return true;
      return ['c', 'cpp'].includes(language)
        && label === '#include'
        && editor.value[prefix.start - 1] === '#'
        && 'include'.startsWith(normalizedPrefix);
    }

    function showSuggestions(force = false) {
      const language = currentLanguage();
      const prefix = currentPrefix();
      if (!force && prefix.word.length < 2) {
        hideSuggestions();
        return;
      }
      const candidates = completions[language] || [];
      suggestions = candidates
        .filter(([label]) => matchesCompletion(label, prefix, language, force))
        .slice(0, 8);
      if (!suggestions.length) {
        hideSuggestions();
        return;
      }
      selectedSuggestion = 0;
      positionSuggestions();
      suggestionList.replaceChildren();
      suggestions.forEach(([label, detail], index) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'cs-editor-suggestion';
        option.setAttribute('role', 'option');
        option.setAttribute('aria-selected', String(index === selectedSuggestion));
        const name = document.createElement('span');
        name.className = 'cs-editor-suggestion-label';
        name.textContent = label;
        const description = document.createElement('span');
        description.className = 'cs-editor-suggestion-detail';
        description.textContent = detail;
        option.append(name, description);
        option.addEventListener('mousedown', (event) => event.preventDefault());
        option.addEventListener('click', () => applySuggestion(index));
        suggestionList.appendChild(option);
      });
      suggestionList.hidden = false;
      editor.setAttribute('aria-expanded', 'true');
    }

    function applySuggestion(index) {
      const candidate = suggestions[index];
      if (!candidate) return;
      const [label] = candidate;
      const prefix = currentPrefix();
      const language = currentLanguage();
      const beforePrefix = editor.value.slice(0, prefix.start);
      const qualifier = label.match(/^(.+[.:])([^.:]+)$/);
      const isQualifiedContext = qualifier && beforePrefix.endsWith(qualifier[1]);
      const isIncludeContext = ['c', 'cpp'].includes(language) && label === '#include' && beforePrefix.endsWith('#');
      const htmlTagContext = language === 'html' && /<\s*$/.test(beforePrefix);
      const voidHtmlTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
      let insert = snippets[language]?.[label] || label;
      if (isQualifiedContext) insert = qualifier[2];
      else if (isIncludeContext) insert = 'include';
      else if (htmlTagContext) insert = voidHtmlTags.has(label)
        ? `${label} />`
        : `${label}></${label}>`;
      editor.setRangeText(insert, prefix.start, editor.selectionStart, 'end');
      const cursorOffset = insert.indexOf('\n');
      if (htmlTagContext && !voidHtmlTags.has(label)) {
        const cursor = prefix.start + label.length + 1;
        editor.setSelectionRange(cursor, cursor);
      } else if (cursorOffset >= 0) {
        const innerIndent = insert.indexOf('    ');
        const cursor = prefix.start + (innerIndent >= 0 ? innerIndent + 4 : cursorOffset + 1);
        editor.setSelectionRange(cursor, cursor);
      }
      hideSuggestions();
      editor.setAttribute('aria-expanded', 'false');
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      editor.focus();
    }

    function maskStringsAndComments(source, language) {
      const chars = source.split('');
      let quote = '';
      let escaped = false;
      let lineComment = false;
      let blockComment = false;
      for (let i = 0; i < source.length; i += 1) {
        const char = source[i];
        const next = source[i + 1];
        if (lineComment) {
          if (char === '\n') lineComment = false;
          else chars[i] = ' ';
          continue;
        }
        if (blockComment) {
          if (char === '*' && next === '/') {
            chars[i] = chars[i + 1] = ' ';
            i += 1;
            blockComment = false;
          } else if (char !== '\n') chars[i] = ' ';
          continue;
        }
        if (quote) {
          if (char !== '\n') chars[i] = ' ';
          if (escaped) escaped = false;
          else if (char === '\\') escaped = true;
          else if (char === quote) quote = '';
          continue;
        }
        if (char === '"' || char === "'" || (language === 'javascript' && char === '`')) {
          quote = char;
          chars[i] = ' ';
        } else if (char === '#' && ['python', 'sql', 'c', 'cpp'].includes(language)) {
          lineComment = true;
          chars[i] = ' ';
        } else if (char === '/' && next === '/' && language !== 'python' && language !== 'sql' && language !== 'html') {
          lineComment = true;
          chars[i] = chars[i + 1] = ' ';
          i += 1;
        } else if (char === '/' && next === '*' && ['javascript', 'c', 'cpp', 'java', 'css'].includes(language)) {
          blockComment = true;
          chars[i] = chars[i + 1] = ' ';
          i += 1;
        }
      }
      return chars.join('');
    }

    function checkDelimiters(source, language, diagnostics) {
      const masked = maskStringsAndComments(source, language);
      const stack = [];
      const pairs = { ')': '(', ']': '[', '}': '{' };
      const lines = [];
      for (let i = 0; i < masked.length; i += 1) {
        if (masked[i] === '\n') lines.push(i);
        if ('([{'.includes(masked[i])) stack.push({ char: masked[i], offset: i });
        else if (pairs[masked[i]]) {
          const opening = stack.pop();
          const line = lines.length + 1;
          if (!opening || opening.char !== pairs[masked[i]]) {
            diagnostics.push({ severity: 'error', line, message: `Unexpected "${masked[i]}" or mismatched delimiter.` });
          }
        }
      }
      stack.forEach(({ char, offset }) => {
        const line = source.slice(0, offset).split('\n').length;
        diagnostics.push({ severity: 'error', line, message: `Missing closing "${char === '(' ? ')' : char === '[' ? ']' : '}'}".` });
      });
    }

    function checkPython(source, diagnostics) {
      const lines = source.split('\n');
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (/^(def|class|if|elif|else|for|while|try|except|finally|with)\b/.test(trimmed) && !trimmed.endsWith(':')) {
          diagnostics.push({ severity: 'error', line: index + 1, message: 'Python block header must end with a colon.' });
        }
        if (trimmed.endsWith(':') && index < lines.length - 1) {
          const next = lines[index + 1];
          if (next.trim() && next.match(/^\s*/)[0].length <= line.match(/^\s*/)[0].length) {
            diagnostics.push({ severity: 'error', line: index + 2, message: 'Expected an indented block after this header.' });
          }
        }
        if (/^\t+ +|^ +\t/.test(line)) {
          diagnostics.push({ severity: 'warning', line: index + 1, message: 'Mixed tabs and spaces can cause Python indentation errors.' });
        }
      });
    }

    function checkJavaScript(source, diagnostics) {
      try {
        // Compile only; never execute student code during live diagnostics.
        new Function(`"use strict";\n${source}`);
      } catch (error) {
        const match = String(error.message).match(/(?:line|:)(\s*\d+)/i);
        diagnostics.push({ severity: 'error', line: match ? Math.max(1, Number(match[1]) - 1) : 1, message: `JavaScript syntax: ${error.message}` });
      }
      const masked = maskStringsAndComments(source, 'javascript');
      if (/\bif\s*\([^)]*[^=!<>]=[^=][^)]*\)/.test(masked)) {
        diagnostics.push({ severity: 'warning', line: 1, message: 'Assignment inside a condition may be accidental; use a comparison if intended.' });
      }
    }

    function checkHtml(source, diagnostics) {
      const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
      const stack = [];
      const tags = /<!--[\s\S]*?-->|<\/?([a-z][\w-]*)\b[^>]*>/gi;
      let match;
      while ((match = tags.exec(source))) {
        if (match[0].startsWith('<!--')) continue;
        const name = match[1].toLowerCase();
        const line = source.slice(0, match.index).split('\n').length;
        if (match[0][1] === '/') {
          const open = stack.pop();
          if (open !== name) diagnostics.push({ severity: 'error', line, message: `Closing </${name}> does not match the most recent open tag${open ? ` <${open}>` : ''}.` });
        } else if (!voidTags.has(name) && !match[0].endsWith('/>')) stack.push(name);
      }
      stack.forEach((name) => diagnostics.push({ severity: 'error', line: source.split(`<${name}`)[0].split('\n').length, message: `Missing closing </${name}> tag.` }));
    }

    function checkSql(source, diagnostics) {
      const trimmed = source.trim().replace(/;+\s*$/, '');
      if (/^SELECT\b/i.test(trimmed) && !/\bFROM\b/i.test(trimmed)) {
        diagnostics.push({ severity: 'error', line: 1, message: 'SELECT query is missing a FROM clause.' });
      }
      if (/^SELECT\s+FROM\b/i.test(trimmed)) {
        diagnostics.push({ severity: 'error', line: 1, message: 'Add a column list between SELECT and FROM.' });
      }
      if (/^INSERT\s+INTO\b/i.test(trimmed) && !/\bVALUES\b|\bSELECT\b/i.test(trimmed)) {
        diagnostics.push({ severity: 'error', line: 1, message: 'INSERT query needs VALUES or a SELECT source.' });
      }
      if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE)\b/i.test(trimmed) && /(?:=|,)\s*$/.test(trimmed)) {
        diagnostics.push({ severity: 'error', line: source.split('\n').length, message: 'SQL statement ends with an incomplete expression.' });
      }
    }

    function checkSemanticHints(source, language, diagnostics) {
      if (!['javascript', 'python'].includes(language)) return;
      const masked = maskStringsAndComments(source, language);
      const declared = new Set();
      const declarationPattern = language === 'python'
        ? /^\s*(?:def|class|for|with|as)\s+([A-Za-z_]\w*)|^\s*([A-Za-z_]\w*)\s*(?:=|,)/gm
        : /\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g;
      for (const match of masked.matchAll(declarationPattern)) {
        for (const group of match.slice(1)) if (group) declared.add(group);
      }
      const paramsPattern = language === 'python'
        ? /\bdef\s+[A-Za-z_]\w*\s*\(([^)]*)\)/g
        : /\bfunction\s+[A-Za-z_$][\w$]*\s*\(([^)]*)\)/g;
      for (const match of masked.matchAll(paramsPattern)) {
        match[1].split(',').forEach((param) => {
          const name = param.trim().match(/^[A-Za-z_$][\w$]*/);
          if (name) declared.add(name[0]);
        });
      }
      const imported = language === 'python'
        ? [...masked.matchAll(/^\s*from\s+\S+\s+import\s+(.+)|^\s*import\s+([A-Za-z_]\w*)/gm)].flatMap((match) => `${match[1] || match[2]}`.split(',').map((part) => part.trim().split(/\s+as\s+/).pop()))
        : [...masked.matchAll(/\bimport\s+([A-Za-z_$][\w$]*)/g)].map((match) => match[1]);
      imported.forEach((name) => declared.add(name));
      const known = builtins[language];
      const callPattern = /(?<![.\w])([A-Za-z_$][\w$]*)\s*\(/g;
      for (const match of masked.matchAll(callPattern)) {
        const name = match[1];
        if (!declared.has(name) && !known.has(name) && !['if', 'for', 'while', 'switch', 'catch', 'function', 'def', 'class', 'return', 'typeof', 'new', 'super'].includes(name)) {
          const line = masked.slice(0, match.index).split('\n').length;
          diagnostics.push({ severity: 'warning', line, message: `Possible unresolved function "${name}"; verify it is defined or imported.` });
        }
      }
    }

    function analyze(showInDock = false) {
      const source = editor.value;
      const language = currentLanguage();
      const diagnostics = [];
      if (source.trim()) {
        checkDelimiters(source, language, diagnostics);
        if (language === 'javascript') checkJavaScript(source, diagnostics);
        if (language === 'python') checkPython(source, diagnostics);
        if (language === 'html') checkHtml(source, diagnostics);
        if (language === 'sql') checkSql(source, diagnostics);
        checkSemanticHints(source, language, diagnostics);
      }
      const errors = diagnostics.filter((item) => item.severity === 'error').length;
      const warnings = diagnostics.length - errors;
      if (!source.trim()) setStatus('Ready · type to check', 'neutral');
      else if (errors) setStatus(`${errors} error${errors === 1 ? '' : 's'}${warnings ? ` · ${warnings} warning${warnings === 1 ? '' : 's'}` : ''}`, 'error');
      else if (warnings) setStatus(`${warnings} possible issue${warnings === 1 ? '' : 's'}`, 'warning');
      else setStatus('No issues found by quick checks', 'clean');

      if (showInDock) {
        const dockTab = document.querySelector('#csDockTabs [data-dock-tab="errors"]');
        dockTab?.click();
        if (diagnosticsPane) {
          diagnosticsPane.classList.remove('text-danger');
          diagnosticsPane.textContent = diagnostics.length
            ? diagnostics.map((item) => `${item.severity.toUpperCase()} · Line ${item.line}: ${item.message}`).join('\n')
            : 'Quick syntax and semantic checks found no issues. Use Run/Build for compiler and runtime diagnostics.';
        }
      }
      return diagnostics;
    }

    function correctAtBoundary(event) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1 || !/[\s,;:.)\]}]/.test(event.key)) return false;
      const prefix = currentPrefix();
      if (!prefix.word) return false;
      const lineStart = editor.value.lastIndexOf('\n', editor.selectionStart - 1) + 1;
      const beforeLine = editor.value.slice(lineStart, editor.selectionStart);
      if (/(['"`]).*\1/.test(beforeLine)) return false;
      const language = currentLanguage();
      if ((language === 'python' || language === 'sql') && beforeLine.includes('#')) return false;
      if (beforeLine.includes('//') || beforeLine.includes('/*')) return false;
      const replacement = corrections[language]?.[prefix.word.toLowerCase()];
      if (!replacement) return false;
      event.preventDefault();
      editor.setRangeText(replacement + event.key, prefix.start, editor.selectionStart, 'end');
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      setStatus(`Auto-corrected "${prefix.word}" to "${replacement}"`, 'clean');
      return true;
    }

    function handleEditorKeys(event) {
      if (event.defaultPrevented) return;
      if ((event.ctrlKey || event.metaKey) && event.code === 'Space') {
        event.preventDefault();
        showSuggestions(true);
        return;
      }
      if (!suggestionList.hidden) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          selectedSuggestion = (selectedSuggestion + (event.key === 'ArrowDown' ? 1 : suggestions.length - 1)) % suggestions.length;
          suggestionList.querySelectorAll('.cs-editor-suggestion').forEach((option, index) => option.setAttribute('aria-selected', String(index === selectedSuggestion)));
          suggestionList.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
          return;
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          event.preventDefault();
          applySuggestion(selectedSuggestion);
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          hideSuggestions();
          return;
        }
      }
      if (correctAtBoundary(event)) return;
      if (event.key === 'Enter') {
        event.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const currentLine = editor.value.slice(0, start).split('\n').pop() || '';
        const indent = (currentLine.match(/^\s*/) || [''])[0];
        const opensBlock = /[{[(]\s*$/.test(currentLine);
        const closesPair = opensBlock && /^\s*[})\]]/.test(editor.value.slice(end));
        const increase = opensBlock || (currentLanguage() === 'python' && /:\s*$/.test(currentLine));
        const inserted = closesPair
          ? `\n${indent}    \n${indent}`
          : `\n${indent}${increase ? '    ' : ''}`;
        editor.setRangeText(inserted, start, end, 'end');
        if (closesPair) {
          const cursor = start + 1 + indent.length + 4;
          editor.setSelectionRange(cursor, cursor);
        }
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (['(', '[', '{', '"', "'"].includes(event.key) && !event.ctrlKey && !event.metaKey) {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const closing = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" }[event.key];
        event.preventDefault();
        editor.setRangeText(event.key + closing, start, end, 'end');
        editor.setSelectionRange(start + 1, start + 1);
        editor.dispatchEvent(new Event('input', { bubbles: true }));
      } else if ([')', ']', '}'].includes(event.key) && editor.value[editor.selectionStart] === event.key) {
        event.preventDefault();
        editor.setSelectionRange(editor.selectionStart + 1, editor.selectionStart + 1);
      }
    }

    editor.addEventListener('keydown', handleEditorKeys, true);
    editor.addEventListener('input', () => {
      showSuggestions();
      window.clearTimeout(checkTimer);
      checkTimer = window.setTimeout(() => analyze(false), 350);
    });
    editor.addEventListener('click', () => {
      if (!suggestionList.hidden) positionSuggestions();
    });
    editor.addEventListener('scroll', () => {
      if (!suggestionList.hidden) positionSuggestions();
    });
    editor.addEventListener('blur', () => window.setTimeout(hideSuggestions, 120));
    languageSelect.addEventListener('change', () => {
      hideSuggestions();
      analyze(false);
    });
    editor.addEventListener('cs-editor-refresh', () => {
      hideSuggestions();
      analyze(false);
    });
    checkButton?.addEventListener('click', () => analyze(true));
    document.querySelectorAll('#csDockTabs [data-dock-tab="errors"]').forEach((button) => {
      button.addEventListener('click', () => analyze(false));
    });
    analyze(false);
  });
})();
