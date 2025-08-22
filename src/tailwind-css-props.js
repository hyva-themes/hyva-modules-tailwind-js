/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes 2022-present. All rights reserved.
 * This library is distributed under the BSD-3-Clause license.
 */

/**
 * Check if string looks like a color
 * This does not validate if the color value is a valid color and does not support named colors
 *
 * @param {string} value
 * @returns {boolean}
 */
function isColorString(value) {
  value = value.trim().toLowerCase();

  const hexColorRegex = /^#([a-f0-9]{3}|[a-f0-9]{4}|[a-f0-9]{6}|[a-f0-9]{8})$/;
  const colorFunctions = [
    'rgb(',
    'rgba(',
    'hsl(',
    'hsla(',
    'hwb(',
    'lab(',
    'lch(',
    'oklab(',
    'oklch(',
    'color('
  ];

  return (
    hexColorRegex.test(value) ||
    colorFunctions.some((func) => value.startsWith(func))
  );
}

/**
 * Adds a CSS variable to the TailwindCSS Token.
 * This the same method used in the upcoming TailwindCSS v4.
 *
 * @param {string} name - name of the CSS variable
 * @param {string} value - Tailwind config value as a string as the fallback value for the CSS variable
 * @param {string} prefix - Sets a custom prefix to the variable, if empty and the value is a color the prefix `color` is added
 * @returns {*}
 */
function twVar(name, value = '', prefix = '') {
  let varName = prefix ? `${prefix}-${name}` : name;

  if (typeof value !== 'string') {
    console.error(
      'The value does not look like a string or a color string value, please make sure the input is correct'
    );
    return value;
  }

  if (isColorString(value)) {
    varName = prefix ? `${prefix}-${name}` : `color-${name}`;
    return `color-mix(in srgb, var(--${varName}, ${value}) calc(<alpha-value> * 100%), transparent)`;
  }

  if (value) {
    return `var(--${varName}, ${value})`;
  }

  return `var(--${varName})`;
}

/**
 * Adds a CSS variables to the TailwindCSS Tokens.
 * This the same method used in the upcoming TailwindCSS
 *
 * @param {Object} values - Object of Tailwind config values
 * @param {string} prefix - Sets a custom prefix to the variable, if empty and the value is a color the prefix `color` is added
 * @returns {*}
 */
function twProps(values, prefix = '') {
  function wrapWithCSSVar(obj, parentKey = '') {
    const wrapped = {};

    for (let key in obj) {
      const currentKey = parentKey ? `${parentKey}-${key}` : key;

      if (typeof obj[key] === 'object' && obj[key] !== null) {
        wrapped[key] = wrapWithCSSVar(obj[key], currentKey);
      } else {
        let varName = currentKey.toLowerCase();

        if (varName.endsWith('default')) {
          varName = varName.replace('-default', '');
        }

        if (prefix) {
          varName = varName === 'default' ? prefix : `${prefix}-${varName}`;
        }

        const newValue = twVar(varName, obj[key]);
        wrapped[key] = newValue;
      }
    }

    return wrapped;
  }

  return wrapWithCSSVar(values);
}

export { twVar, twProps };
