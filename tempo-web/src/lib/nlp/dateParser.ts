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

export interface ParseResult {
    title: string;
    parsedDate: ParsedDate | null;
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
            let date = parser(now);
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
            let year = now.getFullYear();
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
            let year = now.getFullYear();
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
        let year = now.getFullYear();
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
 * Main parser: extracts date from end of string
 * Returns the title (without date) and parsed date
 */
export function parseTaskInput(input: string, now: Date = new Date()): ParseResult {
    const trimmed = input.trim();
    if (!trimmed) {
        return { title: '', parsedDate: null };
    }

    // Try parsing the entire string as a date (for /go command)
    const wholeDate = tryParseDate(trimmed, now);
    if (wholeDate) {
        return { title: '', parsedDate: wholeDate };
    }

    // Try to find date at the end of the string
    // We try progressively shorter suffixes
    const words = trimmed.split(/\s+/);

    for (let i = 1; i <= Math.min(words.length - 1, 5); i++) {
        const potentialDate = words.slice(-i).join(' ');
        const parsed = tryParseDate(potentialDate, now);

        if (parsed) {
            // Check for time modifier in remaining text
            const titleWords = words.slice(0, -i);
            const title = titleWords.join(' ');

            // Look for time in the date portion
            const time = parseTime(potentialDate);
            if (time) {
                parsed.date = setHours(setMinutes(parsed.date, time.minutes), time.hours);
                parsed.hasTime = true;
            }

            return {
                title: title.trim(),
                parsedDate: parsed,
            };
        }
    }

    // No date found, return entire input as title
    return { title: trimmed, parsedDate: null };
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
