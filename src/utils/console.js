/**
 * Print a colored message to the console using ANSI escape codes.
 *
 * @param {string} message - The message to print.
 * @param {"error"|"success"|"warn"|"reset"} [color="reset"] - The color type.
 */
function consoleColor(message, color = "reset") {
    const colors = {
        error: "\x1B[31m",
        success: "\x1B[32m",
        warn: "\x1B[33m",
        reset: "\x1B[0m",
    };
    const colorCode = colors[color] || colors.reset;
    console.log(`${colorCode}${message}${colors.reset}`);
}

/**
 * Prints a error message.
 * @param {string} msg
 */
export const consoleError = (msg) => consoleColor(msg, "error");

/**
 * Prints a success message.
 * @param {string} msg
 */
export const consoleSuccess = (msg) => consoleColor(msg, "success");

/**
 * Prints a warning message.
 * @param {string} msg
 */
export const consoleWarn = (msg) => consoleColor(msg, "warn");
