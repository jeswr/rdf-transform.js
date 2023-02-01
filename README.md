# RDF Transform

Easily transform between RDF syntaxes

[![GitHub license](https://img.shields.io/github/license/jeswr/rdf-transform.js.svg)](https://github.com/jeswr/rdf-transform.js/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/rdf-transform.svg)](https://www.npmjs.com/package/rdf-transform)
[![build](https://img.shields.io/github/actions/workflow/status/jeswr/rdf-transform.js/nodejs.yml?branch=main)](https://github.com/jeswr/rdf-transform.js/tree/main/)
[![Dependabot](https://badgen.net/badge/Dependabot/enabled/green?icon=dependabot)](https://dependabot.com/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

## Usage

We can transform between two content types as follows

```ts
import { transform } from 'rdf-transform';

const textStream = require('streamify-string')(`
<http://ex.org/s> <http://ex.org/p> <http://ex.org/o1>, <http://ex.org/o2>.
`);

transform(textStream, { from: { contentType: 'text/turtle' }, to: { contentType: 'application/ld+json' }, baseIRI: 'http://example.org' })
    .on('data', (str) => console.log(str))
    .on('error', (error) => console.error(error))
    .on('end', () => console.log('All done!'));
```

Sometimes we wish to dynamically discover which content types we support transforming to; this can be done as follows

```ts
import { allowedDestinations } from 'rdf-transform';

// ['text/turtle', 'text/n3', ..., 'application/ld+json']
const destinations = await allowedDestinations('text/turtle');
```

## License
©2023–present
[Jesse Wright](https://github.com/jeswr),
[MIT License](https://github.com/jeswr/useState/blob/master/LICENSE).
