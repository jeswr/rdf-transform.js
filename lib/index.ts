import { RdfParser, rdfParser as parse, rdfParser } from 'rdf-parse';
import { type SerializeOptions, RdfSerializer, rdfSerializer as serialize } from 'rdf-serialize';
import { write } from '@jeswr/pretty-turtle';
import { arrayifyStream } from 'arrayify-stream';
import { Readable } from 'readable-stream';

export interface TransformOptions {
  baseIRI?: string | undefined;
  // Force the stream to be parsed and re-serialized,
  // even if the input content-type satisfies the output
  // content type
  forceTransform?: boolean | undefined;
  from: SerializeOptions;
  to: SerializeOptions;
  pretty?: boolean | undefined;
}

const CONTENT_MAPPINGS: { [id: string]: string } = {
  ...RdfParser.CONTENT_MAPPINGS,
  ...RdfSerializer.CONTENT_MAPPINGS,
  ttl: 'text/turtle',
  turtle: 'text/turtle',
  shaclc: 'text/shaclc',
  shc: 'text/shaclc',
  shaclce: 'text/shaclc-ext',
  shce: 'text/shaclc-ext',
  nt: 'application/n-triples',
  ntriples: 'application/n-triples',
  nq: 'application/n-quads',
  nquads: 'application/n-quads',
  rdf: 'application/rdf+xml',
  rdfxml: 'application/rdf+xml',
  owl: 'application/rdf+xml',
  n3: 'text/n3',
  trig: 'application/trig',
  jsonld: 'application/ld+json',
  json: 'application/json',
  html: 'text/html',
  htm: 'text/html',
  xhtml: 'application/xhtml+xml',
  xht: 'application/xhtml+xml',
  xml: 'application/xml',
  svg: 'image/svg+xml',
  svgz: 'image/svg+xml',
};

const subsets: Record<string, Set<string> | undefined> = {
  'application/n-triples': new Set([
    'text/turtle',
    'text/n3',
    'application/n-quads',
  ]),
  'text/turtle': new Set(['text/n3']),
  'text/shaclc': new Set(['text/shaclc-ext']),
};

export function getContentTypeFromExtension(path: string): string {
  const dotIndex = path.lastIndexOf('.');
  if (dotIndex >= 0) {
    return CONTENT_MAPPINGS[path.substring(dotIndex + 1)] || '';
  }
  return '';
}

export function getContentType(options: SerializeOptions): string {
  if ('contentType' in options && typeof options.contentType === 'string') {
    return options.contentType;
  }

  if ('path' in options && typeof options.path === 'string') {
    return getContentTypeFromExtension(options.path);
  }

  throw new Error('No content type found');
}

// Get the content types that we are able to transform *to* from a given content-type source
export async function allowedDestinations(
  contentType: string,
  forceTransform?: boolean,
) {
  // If a transformation is forced then we are limited to the content types we can serialize to
  if (forceTransform) return serialize.getContentTypes();

  // If we are not forcing transformations then we can also include the current content type
  // and all supersets of that content type
  return [
    ...new Set([
      contentType,
      ...(subsets[contentType] ?? []),
      ...(await serialize.getContentTypes()),
    ]),
  ];
}

async function pretty(stream: NodeJS.ReadableStream, options: TransformOptions, to: string) {
  const prefixes: Record<string, string> = {};

  const quads = rdfParser.parse(stream, {
    baseIRI: options.baseIRI,
    contentType: getContentType(options.from),
  });
  quads.on('prefix', (prefix, iri) => {
    prefixes[prefix] = typeof iri === 'string' ? iri : iri.value;
  });
  const arr = await arrayifyStream(quads);
  return write(arr, { format: to, prefixes });
}

function streamFromPromise(promise: Promise<string>): NodeJS.ReadableStream {
  const stream = new Readable();
  // eslint-disable-next-line no-underscore-dangle
  stream._read = () => { /* no-op */ };
  promise.then((result) => {
    stream.push(result);
    stream.push(null);
  }).catch((err) => {
    stream.emit('error', err);
    stream.push(null);
  });
  return stream;
}

export function transform(
  stream: NodeJS.ReadableStream,
  options: TransformOptions,
): NodeJS.ReadableStream {
  const from = getContentType(options.from);
  const to = getContentType(options.to);

  // If transformations are not forced,
  // and we are transforming to a content-type that is the same as, or a
  // subset of the source, then just return the original stream
  if (!options.forceTransform && !options.pretty) {
    if (from === to || subsets[from]?.has(to)) return stream;
  }

  if (options.pretty && (to === 'text/turtle' || to === 'text/n3')) {
    return streamFromPromise(pretty(stream, options, to));
  }

  return serialize.serialize(
    parse.parse(stream, { baseIRI: options.baseIRI, contentType: from }),
    { contentType: to },
  );
}
