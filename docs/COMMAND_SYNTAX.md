# Tempo Command Bar Syntax Guide

The Command Bar (`cmd+k` / `ctrl+k`) is your keyboard-first interface for interacting with Tempo. It supports natural language for quick task creation and navigation.

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/task` | Create a new task | `/task Buy milk > tomorrow` |
| `/go` | Jump to a specific date | `/go next friday` |
| `/today` | Quickly jump to today's date | `/today` |
| `/help` | Show available commands | `/help` |

> **Note:** You can often omit the command name if the context is clear, but using the explicit command guarantees the correct mode.

## Task Creation Syntax

To create a task, us the `/task` command followed by your task title and optionally a due date.

### Using the `>` Delimiter
Use the `>` character to explicitly separate the task title from the due date. This prevents words in your title (like "next") from being interpreted as part of the date.

**Format:** `/task [Title] > [Date Expression]`

**Examples:**
- `/task Prepare for Q1 review > next friday`
- `/task Ship feature > jan 25 at 5pm`
- `/task Call Mom > in 3 days`

### Natural Language (Smart Parsing)
If you don't use `>`, Tempo will try to find a date at the end of your input.

**Examples:**
- `/task Buy groceries tomorrow`
- `/task Dentist appointment Jan 15`

## Date & Time Formats

Tempo understands a wide range of date expressions.

### Relative Dates
- `today`, `tomorrow`, `yesterday`
- `in 3 days`, `in 2 weeks`, `in 1 month`
- `next week`, `next month`, `end of month`

### Weekdays
- `monday`, `tue`, `wednesday`
- `next friday`, `this saturday`

### Explicit Dates
- `jan 15`, `january 15th`
- `15 jan`, `15th january`
- `1/15` (Month/Day)
- `2026-01-15` (ISO)

### Time Parsing
You can add a time to any date expression.
- `at 3pm`, `at 15:00`
- `tomorrow 9am`
- `monday at 10:30`

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `cmd+k` / `ctrl+k` | Open Command Bar |
| `↑` / `↓` | Navigate search results or hints |
| `enter` | Select item or confirm action |
| `esc` | Close Command Bar |
