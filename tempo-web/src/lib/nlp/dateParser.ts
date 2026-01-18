import {
    addDays,
    addWeeks,
    addMonths,
    startOfDay,
    endOfMonth,
    nextMonday,
    nextTuesday,
    nextWednesday,
    nextThursday,
    nextFriday,
    nextSaturday,
    nextSunday,
    parse,
    setHours,
    setMinutes,
    format,
    isValid,
} from 'date-fns';

// =================================================================
// NATURAL LANGUAGE DATE PARSER
// =================================================================

export interface ParsedDate {
    date: Date;
    matched: string; // The portion of input that was parsed as a date
    hasTime: boolean;
}

export interface ParsedRecurrence {
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    daysOfWeek?: number[];  // 0-6 for weekly (0=Sunday)
    matched: string;
}

export interface ParseResult {
    title: string;
    parsedDate: ParsedDate | null;
    parsedRecurrence: ParsedRecurrence | null;
}

// Weekday name to next* function mapping
const WEEKDAY_PARSERS: Record<string, (date: Date) => Date> = {
    'monday': nextMonday,
    'mon': nextMonday,
    'tuesday': nextTuesday,
    'tue': nextTuesday,
    'tues': nextTuesday,
    'wednesday': nextWednesday,
    'wed': nextWednesday,
    'thursday': nextThursday,
    'thu': nextThursday,
    'thur': nextThursday,
    'thurs': nextThursday,
    'friday': nextFriday,
    'fri': nextFriday,
    'saturday': nextSaturday,
    'sat': nextSaturday,
    'sunday': nextSunday,
    'sun': nextSunday,
};

// Month name mapping
const MONTHS: Record<string, number> = {
    'january': 0, 'jan': 0,
    'february': 1, 'feb': 1,
    'march': 2, 'mar': 2,
    'april': 3, 'apr': 3,
    'may': 4,
    'june': 5, 'jun': 5,
    'july': 6, 'jul': 6,
    'august': 7, 'aug': 7,
    'september': 8, 'sep': 8, 'sept': 8,
    'october': 9, 'oct': 9,
    'november': 10, 'nov': 10,
    'december': 11, 'dec': 11,
};

// Weekday name to index mapping for recurrence
const WEEKDAY_INDICES: Record<string, number> = {
    'sunday': 0, 'sun': 0,
    'monday': 1, 'mon': 1,
    'tuesday': 2, 'tue': 2, 'tues': 2,
    'wednesday': 3, 'wed': 3,
    'thursday': 4, 'thu': 4, 'thur': 4, 'thurs': 4,
    'friday': 5, 'fri': 5,
    'saturday': 6, 'sat': 6,
};

/**
 * Extract time from a string like "at 3pm" or "9:30am"
 * Returns [hours, minutes] or null
 */
function parseTime(text: string): { hours: number; minutes: number; matched: string } | null {
    // Match "at 3pm", "at 3:30pm", "3pm", "15:00", etc.
    const timePatterns = [
        // "at 3pm" or "at 3:30pm"
        /(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i,
        // "at 15:00" or "15:00"
        /(?:at\s+)?(\d{1,2}):(\d{2})(?!\s*(?:am|pm))/i,
    ];

    for (const pattern of timePatterns) {
        const match = text.match(pattern);
        if (match) {
            let hours = parseInt(match[1], 10);
            const minutes = match[2] ? parseInt(match[2], 10) : 0;
            const meridiem = match[3]?.toLowerCase();

            if (meridiem === 'pm' && hours < 12) hours += 12;
            if (meridiem === 'am' && hours === 12) hours = 0;

            return { hours, minutes, matched: match[0] };
        }
    }

    return null;
}

/**
 * Parse relative date expressions
 */
function parseRelative(text: string, now: Date): ParsedDate | null {
    const lower = text.toLowerCase().trim();

    // Today
    if (/^today$/i.test(lower)) {
        return { date: startOfDay(now), matched: 'today', hasTime: false };
    }

    // Tomorrow
    if (/^tomorrow$/i.test(lower)) {
        return { date: startOfDay(addDays(now, 1)), matched: 'tomorrow', hasTime: false };
    }

    // Yesterday
    if (/^yesterday$/i.test(lower)) {
        return { date: startOfDay(addDays(now, -1)), matched: 'yesterday', hasTime: false };
    }

    // "in X days/weeks/months"
    const inXMatch = lower.match(/^in\s+(\d+)\s+(day|days|week|weeks|month|months)$/i);
    if (inXMatch) {
        const amount = parseInt(inXMatch[1], 10);
        const unit = inXMatch[2].toLowerCase();
        let date = now;

        if (unit.startsWith('day')) {
            date = addDays(now, amount);
        } else if (unit.startsWith('week')) {
            date = addWeeks(now, amount);
        } else if (unit.startsWith('month')) {
            date = addMonths(now, amount);
        }

        return { date: startOfDay(date), matched: inXMatch[0], hasTime: false };
    }

    // "next week"
    if (/^next\s+week$/i.test(lower)) {
        return { date: startOfDay(addWeeks(now, 1)), matched: 'next week', hasTime: false };
    }

    // "next month"
    if (/^next\s+month$/i.test(lower)) {
        return { date: startOfDay(addMonths(now, 1)), matched: 'next month', hasTime: false };
    }

    // "end of month"
    if (/^end\s+of\s+month$/i.test(lower)) {
        return { date: endOfMonth(now), matched: 'end of month', hasTime: false };
    }

    return null;
}

/**
 * Parse weekday expressions like "friday", "next monday", "this saturday"
 */
function parseWeekday(text: string, now: Date): ParsedDate | null {
    const lower = text.toLowerCase().trim();

    // Check for "next <weekday>" or "this <weekday>"
    const prefixMatch = lower.match(/^(next|this)\s+(\w+)$/i);
    if (prefixMatch) {
        const weekday = prefixMatch[2].toLowerCase();
        const parser = WEEKDAY_PARSERS[weekday];
        if (parser) {
            const date = parser(now);
            // "next" already gives next occurrence, but if it's "this" and we're past it, still use next
            return { date: startOfDay(date), matched: prefixMatch[0], hasTime: false };
        }
    }

    // Check for bare weekday
    const parser = WEEKDAY_PARSERS[lower];
    if (parser) {
        return { date: startOfDay(parser(now)), matched: lower, hasTime: false };
    }

    return null;
}

/**
 * Parse explicit date formats: "jan 15", "january 15th", "15 jan", "1/15", "2026-01-15"
 */
function parseExplicit(text: string, now: Date): ParsedDate | null {
    const lower = text.toLowerCase().trim();

    // "jan 15" or "january 15th"
    const monthDayMatch = lower.match(/^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?$/i);
    if (monthDayMatch) {
        const monthName = monthDayMatch[1].toLowerCase();
        const day = parseInt(monthDayMatch[2], 10);
        const monthNum = MONTHS[monthName];

        if (monthNum !== undefined) {
            const year = now.getFullYear();
            const date = new Date(year, monthNum, day);
            // If the date is in the past, assume next year
            if (date < now) {
                date.setFullYear(year + 1);
            }
            if (isValid(date)) {
                return { date: startOfDay(date), matched: monthDayMatch[0], hasTime: false };
            }
        }
    }

    // "15 jan" or "15th january"
    const dayMonthMatch = lower.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)$/i);
    if (dayMonthMatch) {
        const day = parseInt(dayMonthMatch[1], 10);
        const monthName = dayMonthMatch[2].toLowerCase();
        const monthNum = MONTHS[monthName];

        if (monthNum !== undefined) {
            const year = now.getFullYear();
            const date = new Date(year, monthNum, day);
            if (date < now) {
                date.setFullYear(year + 1);
            }
            if (isValid(date)) {
                return { date: startOfDay(date), matched: dayMonthMatch[0], hasTime: false };
            }
        }
    }

    // "1/15" (month/day US format)
    const slashMatch = lower.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (slashMatch) {
        const month = parseInt(slashMatch[1], 10) - 1;
        const day = parseInt(slashMatch[2], 10);
        const year = now.getFullYear();
        const date = new Date(year, month, day);
        if (date < now) {
            date.setFullYear(year + 1);
        }
        if (isValid(date)) {
            return { date: startOfDay(date), matched: slashMatch[0], hasTime: false };
        }
    }

    // ISO format "2026-01-15"
    const isoMatch = lower.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
        const date = parse(isoMatch[0], 'yyyy-MM-dd', now);
        if (isValid(date)) {
            return { date: startOfDay(date), matched: isoMatch[0], hasTime: false };
        }
    }

    return null;
}

/**
 * Parse recurrence patterns like "every day", "every monday", "every 2 weeks"
 */
function parseRecurrence(text: string): ParsedRecurrence | null {
    const lower = text.toLowerCase().trim();

    // Simple patterns: "daily", "weekly", "monthly", "yearly"
    if (/^daily$/i.test(lower)) {
        return { pattern: 'daily', interval: 1, matched: lower };
    }
    if (/^weekly$/i.test(lower)) {
        return { pattern: 'weekly', interval: 1, matched: lower };
    }
    if (/^monthly$/i.test(lower)) {
        return { pattern: 'monthly', interval: 1, matched: lower };
    }
    if (/^yearly$/i.test(lower) || /^annually$/i.test(lower)) {
        return { pattern: 'yearly', interval: 1, matched: lower };
    }

    // "every day" / "every week" / "every month" / "every year"
    if (/^every\s+day$/i.test(lower)) {
        return { pattern: 'daily', interval: 1, matched: lower };
    }
    if (/^every\s+week$/i.test(lower)) {
        return { pattern: 'weekly', interval: 1, matched: lower };
    }
    if (/^every\s+month$/i.test(lower)) {
        return { pattern: 'monthly', interval: 1, matched: lower };
    }
    if (/^every\s+year$/i.test(lower)) {
        return { pattern: 'yearly', interval: 1, matched: lower };
    }

    // "every N days/weeks/months/years"
    const everyNMatch = lower.match(/^every\s+(\d+)\s+(day|days|week|weeks|month|months|year|years)$/i);
    if (everyNMatch) {
        const interval = parseInt(everyNMatch[1], 10);
        const unit = everyNMatch[2].toLowerCase();

        if (unit.startsWith('day')) {
            return { pattern: 'daily', interval, matched: lower };
        }
        if (unit.startsWith('week')) {
            return { pattern: 'weekly', interval, matched: lower };
        }
        if (unit.startsWith('month')) {
            return { pattern: 'monthly', interval, matched: lower };
        }
        if (unit.startsWith('year')) {
            return { pattern: 'yearly', interval, matched: lower };
        }
    }

    // "every monday" / "every friday" (single day)
    const everyWeekdayMatch = lower.match(/^every\s+(\w+)$/i);
    if (everyWeekdayMatch) {
        const dayName = everyWeekdayMatch[1].toLowerCase();
        const dayIndex = WEEKDAY_INDICES[dayName];
        if (dayIndex !== undefined) {
            return { pattern: 'weekly', interval: 1, daysOfWeek: [dayIndex], matched: lower };
        }
    }

    // "every mon,wed,fri" or "every monday, wednesday, friday"
    const everyMultipleDaysMatch = lower.match(/^every\s+([\w,\s]+)$/i);
    if (everyMultipleDaysMatch) {
        const daysStr = everyMultipleDaysMatch[1];
        const dayNames = daysStr.split(/[,\s]+/).filter(Boolean);
        const dayIndices: number[] = [];

        for (const name of dayNames) {
            const index = WEEKDAY_INDICES[name.toLowerCase()];
            if (index !== undefined && !dayIndices.includes(index)) {
                dayIndices.push(index);
            }
        }

        if (dayIndices.length > 0) {
            return { pattern: 'weekly', interval: 1, daysOfWeek: dayIndices.sort((a, b) => a - b), matched: lower };
        }
    }

    return null;
}

/**
 * Try to parse a string as a date expression
 */
function tryParseDate(text: string, now: Date): ParsedDate | null {
    // Remove time component for initial parsing
    const timeInfo = parseTime(text);
    const textWithoutTime = timeInfo
        ? text.replace(timeInfo.matched, '').trim()
        : text;

    // Try each parser
    let result = parseRelative(textWithoutTime, now)
        || parseWeekday(textWithoutTime, now)
        || parseExplicit(textWithoutTime, now);

    if (result && timeInfo) {
        result.date = setHours(setMinutes(result.date, timeInfo.minutes), timeInfo.hours);
        result.hasTime = true;
        result.matched = text; // Include time in matched string
    }

    return result;
}

/**
 * Main parser: extracts date and recurrence from input string
 * Returns the title (without date/recurrence) and parsed values
 */
export function parseTaskInput(input: string, now: Date = new Date()): ParseResult {
    const trimmed = input.trim();
    if (!trimmed) {
        return { title: '', parsedDate: null, parsedRecurrence: null };
    }

    // Try parsing the entire string as a date (for /go command)
    const wholeDate = tryParseDate(trimmed, now);
    if (wholeDate) {
        return { title: '', parsedDate: wholeDate, parsedRecurrence: null };
    }

    const words = trimmed.split(/\s+/);
    let parsedRecurrence: ParsedRecurrence | null = null;
    let parsedDate: ParsedDate | null = null;
    let titleEndIndex = words.length;

    // Try to find recurrence at the end of string first (e.g., "Water plants every 3 days")
    for (let i = 1; i <= Math.min(words.length - 1, 5); i++) {
        const potentialRecurrence = words.slice(-i).join(' ');
        const recurrence = parseRecurrence(potentialRecurrence);

        if (recurrence) {
            parsedRecurrence = recurrence;
            titleEndIndex = words.length - i;
            break;
        }
    }

    // Now try to find date in remaining words
    const remainingWords = words.slice(0, titleEndIndex);

    for (let i = 1; i <= Math.min(remainingWords.length - 1, 5); i++) {
        const potentialDate = remainingWords.slice(-i).join(' ');
        const parsed = tryParseDate(potentialDate, now);

        if (parsed) {
            // Look for time in the date portion
            const time = parseTime(potentialDate);
            if (time) {
                parsed.date = setHours(setMinutes(parsed.date, time.minutes), time.hours);
                parsed.hasTime = true;
            }

            parsedDate = parsed;
            titleEndIndex = remainingWords.length - i;
            break;
        }
    }

    // Extract title from remaining words
    const titleWords = parsedRecurrence
        ? words.slice(0, titleEndIndex)
        : remainingWords.slice(0, titleEndIndex);
    const title = titleWords.join(' ').trim();

    // If we found recurrence but no date, default to today for the first occurrence
    if (parsedRecurrence && !parsedDate) {
        parsedDate = { date: startOfDay(now), matched: 'today', hasTime: false };
    }

    return {
        title: title || trimmed,
        parsedDate,
        parsedRecurrence,
    };
}

/**
 * Format a parsed date for display
 */
export function formatParsedDate(parsed: ParsedDate): string {
    const now = new Date();
    const daysDiff = Math.floor(
        (startOfDay(parsed.date).getTime() - startOfDay(now).getTime()) / (1000 * 60 * 60 * 24)
    );

    let relative = '';
    if (daysDiff === 0) relative = 'Today';
    else if (daysDiff === 1) relative = 'Tomorrow';
    else if (daysDiff === -1) relative = 'Yesterday';
    else if (daysDiff > 0 && daysDiff < 7) relative = format(parsed.date, 'EEEE');

    const absolute = parsed.hasTime
        ? format(parsed.date, 'EEE, MMM d \'at\' h:mm a')
        : format(parsed.date, 'EEE, MMM d');

    return relative ? `${relative} • ${absolute}` : absolute;
}
