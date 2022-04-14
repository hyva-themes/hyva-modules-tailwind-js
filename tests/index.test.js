/**
 * Hyvä Themes - https://hyva.io
 * Copyright © Hyvä Themes 2022-present. All rights reserved.
 * This library is distributed under the BSD-3-Clause license.
 */

const { mergeTailwindConfig, hyvaThemesConfig, hyvaModuleDirs } = require('../src/index');

const sut = mergeTailwindConfig;

const v2Target = {
    purge: {
        content: ['../../**/*.phtml', '../../../magento2-theme-module/src/view/frontend/templates/**/*.phtml'],
        safelist: ['a', 'b']
    }
}

const v2ConfigModule = {
    purge: {
        content: ['../templates/**/*.phtml'],
        safelist: ['c', 'd']
    }
}

const v3Target = {
    content: ['../../**/*.js', '../../../templates/**/*.phtml'],
    safelist: ['e', 'f']
}

const v3ConfigModule = {
    content: ['../layout/**/*.xml'],
    safelist: ['g', 'h']
}


test('Merges v2 into v2', () => {
    expect(sut.mergeExtensionConfig('v2', v2Target, v2ConfigModule, __dirname)).toMatchObject({
        purge: {
            content: [
                '../../**/*.phtml',
                '../../../magento2-theme-module/src/view/frontend/templates/**/*.phtml',
                `${__dirname}/view/frontend/templates/**/*.phtml`
            ],
            safelist: ['a', 'b', 'c', 'd']
        }
    });
});


test('Merges v2 into v3', () => {
    expect(sut.mergeExtensionConfig('v3', v3Target, v2ConfigModule, __dirname)).toMatchObject({
        content: [
            '../../**/*.js',
            '../../../templates/**/*.phtml',
            `${__dirname}/view/frontend/templates/**/*.phtml`
        ],
        safelist: ['e', 'f', 'c', 'd']
    });
});


test('Merges v3 into v2', () => {
    const result = sut.mergeExtensionConfig('v2', v2Target, v3ConfigModule, __dirname);
    expect(result).toMatchObject({
        purge: {
            content: [
                '../../**/*.phtml',
                '../../../magento2-theme-module/src/view/frontend/templates/**/*.phtml',
                `${__dirname}/view/frontend/layout/**/*.xml`
            ],
            safelist: ['a', 'b', 'g', 'h']
        }
    });
});


test('Merges v3 into v3', () => {
    expect(sut.mergeExtensionConfig('v3', v3Target, v3ConfigModule, __dirname)).toMatchObject({
        content: [
            '../../**/*.js',
            '../../../templates/**/*.phtml',
            `${__dirname}/view/frontend/layout/**/*.xml`
        ],
        safelist: ['e', 'f', 'g', 'h']
    });
});

test('Exports hyva themes config', () => {
    expect(hyvaThemesConfig).not.toBe(undefined);
});

test('Exports hyva module dirs', () => {
    expect(hyvaModuleDirs).not.toBe(undefined);
});
