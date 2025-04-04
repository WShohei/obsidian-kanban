import { Stat } from 'obsidian';
import { Item } from 'src/components/types';

export interface FileAccessor {
    isEmbed: boolean;
    target: string;
    stats?: Stat;
}

export function markRangeForDeletion(str: string, range: { start: number; end: number }): string {
    const len = str.length;

    let start = range.start;
    while (start > 0 && str[start - 1] === ' ') start--;

    let end = range.end;
    while (end < len - 1 && str[end + 1] === ' ') end++;

    return str.slice(0, start) + '\u0000'.repeat(end - start) + str.slice(end);
}

export function executeDeletion(str: string) {
    return str.replace(/ *\0+ */g, ' ').trim();
}

export function replaceNewLines(str: string) {
    return str.trim().replace(/(?:\r\n|\n)/g, '<br>');
}

export function replaceBrs(str: string) {
    return str.replace(/<br>/g, '\n').trim();
}

export function indentNewLines(str: string) {
    // Simply indent with 4 spaces
    return str.trim().replace(/(?:\r\n|\n)/g, '\n    ');
}

export function addBlockId(str: string, item: Item) {
    if (!item.data.blockId) return str;

    const lines = str.split(/(?:\r\n|\n)/g);
    lines[0] += ' ^' + item.data.blockId;

    return lines.join('\n');
}

export function removeBlockId(str: string) {
    const lines = str.split(/(?:\r\n|\n)/g);

    lines[0] = lines[0].replace(/\s+\^([a-zA-Z0-9-]+)$/, '');

    return lines.join('\n');
}

export function dedentNewLines(str: string) {
    return str.trim().replace(/(?:\r\n|\n)(?: {4}|\t)/g, '\n');
}

export interface LaneTitleSettings {
    title: string;
    maxItems: number;
    complete?: boolean;
    applyStatus?: string;
    sorted?: string;
}

export function parseLaneTitle(str: string): LaneTitleSettings {
    str = replaceBrs(str);

    // Detect settings
    const settings: any = {};

    // Check for special settings (e.g., % status:abc %)
    const settingsRegex = /\s*%\s*([^%]+)\s*%\s*$/;
    const settingsMatch = str.match(settingsRegex);

    if (settingsMatch) {
        // Get the settings string
        const settingsStr = settingsMatch[1];

        // Detect status:value format
        const statusMatch = settingsStr.match(/status:([^,\s]+)/);
        if (statusMatch) {
            const statusValue = statusMatch[1];
            // Treat status:completion as a complete flag, not as applyStatus
            if (statusValue === 'completion') {
                settings.complete = true;
            } else {
                settings.applyStatus = statusValue;
            }
        }

        // Remove the settings part
        str = str.replace(settingsRegex, '');
    }

    // Existing maxItems processing
    const match = str.match(/^(.*?)\s*\((\d+)\)$/);
    if (match != null) {
        return {
            title: match[1],
            maxItems: Number(match[2]),
            ...settings,
        };
    }

    return {
        title: str,
        maxItems: 0,
        ...settings,
    };
}
