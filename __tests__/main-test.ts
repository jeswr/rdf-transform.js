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

  it('should correctly transform between html and turtle', async () => {
    expect(await stringifyStream(
      transform(
        streamifyString(`
        <!DOCTYPE html>
          <html lang="en">
            <div id="me" typeof="foaf:Person" resource="https://www.rubensworks.net/#me">
          </html>
        `),
        {
          from: { contentType: 'text/html' },
          to: { contentType: 'text/turtle' },
        },
      ),
    )).toEqual('<https://www.rubensworks.net/#me> a <http://xmlns.com/foaf/0.1/Person>.\n');
  });

  it('should correctly transform between html and turtle and add prefixes in pretty mode', async () => {
    expect(await stringifyStream(
      transform(
        streamifyString(`
        PREFIX ex: <http://example.org/test#>

        shape ex:TestShape -> ex:TestClass1 {
          ex:path ex:TestProperty [1..*] .
        }
        `),
        {
          from: { contentType: 'text/shaclc' },
          to: { contentType: 'text/turtle' },
          pretty: true,
        },
      ),
    )).toEqual('<https://www.rubensworks.net/#me> a foaf:Person .\n');
  });

  describe('pretty turtle tests', () => {
    it('should pretty print turtle output when pretty option is enabled', async () => {
      const input = '[{"@id": "http://example.org/a", "http://example.org/b": [{"@id": "http://example.org/c"}]}]';
      const output = await stringifyStream(
        transform(
          streamifyString(input),
          {
            from: { contentType: 'application/ld+json' },
            to: { contentType: 'text/turtle' },
            baseIRI: 'http://example.org/',
            pretty: true,
          },
        ),
      );
      console.log(output);
      // The pretty turtle output should be more readable than the default output
      expect(output).toContain('\n');
      expect(output).toContain('<http://example.org/a>');
      expect(output).toContain('<http://example.org/b>');
      expect(output).toContain('<http://example.org/c>');
    });

    it('should pretty print n3 output when pretty option is enabled', async () => {
      const input = '[{"@id": "http://example.org/a", "http://example.org/b": [{"@id": "http://example.org/c"}]}]';
      const output = await stringifyStream(
        transform(
          streamifyString(input),
          {
            from: { contentType: 'application/ld+json' },
            to: { contentType: 'text/n3' },
            baseIRI: 'http://example.org/',
            pretty: true,
          },
        ),
      );

      // The pretty n3 output should be more readable than the default output
      expect(output).toContain('\n');
      expect(output).toContain('<http://example.org/a>');
      expect(output).toContain('<http://example.org/b>');
      expect(output).toContain('<http://example.org/c>');
    });

    it('should ignore pretty option for non-turtle/n3 output', async () => {
      const input = '[{"@id": "http://example.org/a", "http://example.org/b": [{"@id": "http://example.org/c"}]}]';
      const output = await stringifyStream(
        transform(
          streamifyString(input),
          {
            from: { contentType: 'application/ld+json' },
            to: { contentType: 'application/ld+json' },
            baseIRI: 'http://example.org/',
            pretty: true,
          },
        ),
      );
      // The output should be the same as without pretty option
      expect(output).toEqual(`${JSON.stringify(JSON.parse(input), null, 2)}\n`);
    });
  });
});
