import { transform } from '../lib';

const streamifyString = require('streamify-string');
const stringifyStream = require('stream-to-string');

describe('transform tests', () => {
  it('should return original string on subsets if force transformation is not enabled', async () => {
    expect(await stringifyStream(
      transform(
        streamifyString('This is not valid turtle'),
        { from: { contentType: 'text/turtle' }, to: { contentType: 'text/turtle' }, baseIRI: 'http://example.org/' },
      ),
    )).toEqual('This is not valid turtle');

    expect(await stringifyStream(
      transform(
        streamifyString('This is not valid turtle'),
        { from: { contentType: 'text/turtle' }, to: { contentType: 'text/n3' }, baseIRI: 'http://example.org/' },
      ),
    )).toEqual('This is not valid turtle');
  });

  it('should return original string on subsets if force transformation is enabled', async () => {
    expect(stringifyStream(
      transform(
        streamifyString('This is not valid turtle'),
        {
          from: { contentType: 'text/turtle' }, to: { contentType: 'text/turtle' }, baseIRI: 'http://example.org/', forceTransform: true,
        },
      ),
    )).rejects.toThrowError();

    expect(stringifyStream(
      transform(
        streamifyString('This is not valid turtle'),
        {
          from: { contentType: 'text/turtle' }, to: { contentType: 'text/n3' }, baseIRI: 'http://example.org/', forceTransform: true,
        },
      ),
    )).rejects.toThrowError();
  });

  it('should correctly transform between jsonld and turtle', async () => {
    expect(await stringifyStream(
      transform(
        streamifyString('[{"@id": "http://example.org/a", "http://example.org/b": [{"@id": "http://example.org/c"}]}]'),
        {
          from: { contentType: 'application/ld+json' },
          to: { contentType: 'text/turtle' },
          baseIRI: 'http://example.org/',
        },
      ),
    )).toEqual('<http://example.org/a> <http://example.org/b> <http://example.org/c>.\n');
  });
});
