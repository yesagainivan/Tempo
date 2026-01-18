import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

// =================================================================
// MARKDOWN PROCESSOR
// =================================================================

const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true });

/**
 * Process markdown content to HTML
 */
export function processMarkdown(content: string): string {
    const result = processor.processSync(content);
    return String(result);
}

/**
 * Parse checkbox state from markdown content
 * Returns array of { index, checked } for each checkbox found
 */
export function parseCheckboxes(content: string): { line: number; checked: boolean }[] {
    const lines = content.split('\n');
    const checkboxes: { line: number; checked: boolean }[] = [];

    lines.forEach((line, index) => {
        const uncheckedMatch = line.match(/^(\s*[-*+]|\s*\d+\.)\s+\[ \]/);
        const checkedMatch = line.match(/^(\s*[-*+]|\s*\d+\.)\s+\[x\]/i);

        if (uncheckedMatch) {
            checkboxes.push({ line: index, checked: false });
        } else if (checkedMatch) {
            checkboxes.push({ line: index, checked: true });
        }
    });

    return checkboxes;
}

/**
 * Toggle a checkbox at a specific line in the content
 */
export function toggleCheckbox(content: string, lineNumber: number): string {
    const lines = content.split('\n');

    if (lineNumber < 0 || lineNumber >= lines.length) {
        return content;
    }

    const line = lines[lineNumber];

    // Toggle unchecked -> checked
    if (/\[ \]/.test(line)) {
        lines[lineNumber] = line.replace('[ ]', '[x]');
    }
    // Toggle checked -> unchecked
    else if (/\[x\]/i.test(line)) {
        lines[lineNumber] = line.replace(/\[x\]/i, '[ ]');
    }

    return lines.join('\n');
}

/**
 * Process markdown with checkbox data attributes for interactivity
 * Adds data-line attributes to checkbox inputs
 */
export function processMarkdownWithCheckboxes(content: string): string {
    // First, transform checkbox syntax to include line numbers
    const lines = content.split('\n');
    const transformedLines = lines.map((line, index) => {
        // Replace [ ] with a special marker that includes line number
        return line
            .replace(/^(\s*[-*+]|\s*\d+\.)\s+\[ \]/, `$1 <input type="checkbox" data-line="${index}" disabled />`)
            .replace(/^(\s*[-*+]|\s*\d+\.)\s+\[x\]/i, `$1 <input type="checkbox" data-line="${index}" checked disabled />`);
    });

    const transformed = transformedLines.join('\n');
    return processMarkdown(transformed);
}
