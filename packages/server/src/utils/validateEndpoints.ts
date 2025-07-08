import SwaggerParser from '@apidevtools/swagger-parser';
import axios, { AxiosError } from 'axios';
import { OpenAPIV3 } from 'openapi-types';

interface Failure {
  method: string;
  path: string;
  status?: number;
}

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000/api/v1';

async function main(): Promise<void> {
  try {
    // Validate & dereference the spec, cast to OpenAPI v3 document
    const api = (await SwaggerParser.validate(
      'openapi.yaml'
    )) as OpenAPIV3.Document;

    const failures: Failure[] = [];
    const paths = api.paths as Record<string, OpenAPIV3.PathItemObject>;

    for (const [rawPath, pathItem] of Object.entries(paths)) {
      for (const method of Object.keys(pathItem)) {
        if (method === 'parameters') continue;

        // substitute dummy values into path parameters
        const testPath = rawPath.replace(/\{[^}]+\}/g, '1');
        const url = `${BASE_URL}${testPath}`;

        try {
          // Try a HEAD first
          await axios.head(url);
        } catch (err) {
          const error = err as AxiosError;
          const status = error.response?.status;

          if (status === 405) {
            // HEAD not allowed → fallback to GET
            try {
              await axios.get(url);
            } catch (err2) {
              const error2 = err2 as AxiosError;
              failures.push({
                method: method.toUpperCase(),
                path: rawPath,
                status: error2.response?.status,
              });
            }
          } else {
            failures.push({
              method: method.toUpperCase(),
              path: rawPath,
              status,
            });
          }
        }
      }
    }

    if (failures.length > 0) {
      console.error('Missing or broken endpoints:');
      failures.forEach(f => {
        console.error(`  [${f.method}] ${f.path} → status ${f.status}`);
      });
      process.exit(1);
    }

    console.log('All endpoints exist!');
  } catch (err) {
    console.error('Error validating spec or contacting server:', err);
    process.exit(1);
  }
}

main();
