const StyleDictionary = require('style-dictionary');
const { fileHeader, formattedVariables } = StyleDictionary.formatHelpers;


StyleDictionary.registerFormat({
  name: `darkValues`,
  formatter: function({dictionary, file}) {
    console.log(dictionary.allTokens)
    return '@media (prefers-color-scheme: dark) { \n :root {\n' +
      formattedVariables('css', dictionary, file.options.outputReferences) +
      '\n}\n}\n';
  }
});

/**
 * This function will wrap a built-in format and replace `.value` with `.darkValue`
 * if a token has a `.darkValue`.
 * @param {String} format - the name of the built-in format
 * @returns {Function}
 */
function darkFormatWrapper(format) {
  return function(args) {
    const dictionary = Object.assign({}, args.dictionary);
    // Override each token's `value` with `darkValue`
    dictionary.allProperties = dictionary.allProperties.map(token => {
      const {darkValue} = token;
      if (darkValue) {
        return Object.assign({}, token, {
          value: token.darkValue
        });
      } else {
        return token;
      }
    });
    
    // Use the built-in format but with our customized dictionary object
    // so it will output the darkValue instead of the value
    return StyleDictionary.format[format]({ ...args, dictionary })
  }
}

module.exports = {
  source: ['tokens/**/*.json'],
  transform: {
    // For backwards compatibility, all built-in transforms are not transitive
    // by default. This will make the 'color/css' transform transitive
    'color/css': Object.assign({}, StyleDictionary.transform[`color/css`], {
      transitive: true,
    }),
  },
  // custom formats
  format: {
    cssDark: darkFormatWrapper(`darkValues`),
  },
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: './dist/',
      options: {
        outputReferences: true,
        // Right now it's :root but we may want to change it to:
        // selector: '.roll-theme--light',
      },
      files: [
        {
          destination: 'variables.css',
          format: 'css/variables',
        },
        {
          destination: `variables-dark.css`,
          format: `cssDark`,
          filter: (token) =>
            token.darkValue &&
            (token.attributes.category === `color` ||
              token.attributes.item === `background` ||
              // alias background tokens
              (token.attributes.category === `alias` &&
                token.attributes.type === `background`) ||
                (token.attributes.category === `alias` &&
                token.attributes.type === `border`)
                ),
        },
      ]
    }
  },
};
