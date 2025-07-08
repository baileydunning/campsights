import SwaggerParser from '@apidevtools/swagger-parser';
import axios, { AxiosError } from 'axios';
import { OpenAPIV3 } from 'openapi-types';

interface Failure {
  method: string;
  path: string;
  status?: number;
}

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000/api/v1';

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

async function main(): Promise<void> {
  try {
    console.log('Validating and dereferencing OpenAPI spec...');
    const api = (await SwaggerParser.validate(
      'openapi.yaml'
    )) as OpenAPIV3.Document;
    console.log('OpenAPI spec validated.');

    const failures: Failure[] = [];
    const paths = api.paths as Record<string, OpenAPIV3.PathItemObject>;
    console.log(`Found ${Object.keys(paths).length} paths in spec.`);

    for (const [rawPath, pathItem] of Object.entries(paths)) {
      console.log(`Checking path: ${rawPath}`);
      for (const method of Object.keys(pathItem)) {
        if (method === 'parameters') continue;

        let testPath = rawPath;

        if (rawPath.includes('{id}')) {
          testPath = rawPath.replace(/\{id\}/g, 'camp_001');
        } else {
          testPath = rawPath.replace(/\{[^}]+\}/g, '1');
        }
        const url = `${BASE_URL}${testPath}`;
        console.log(`  [${method.toUpperCase()}] ${url}`);

        try {
          await axios.head(url);
          console.log(`    HEAD succeeded for ${url}`);
        } catch (err) {
          const error = err as AxiosError;
          const status = error.response?.status;
          console.log(`    HEAD failed for ${url} with status ${status}`);

          if (status === 405) {
            try {
              await axios.get(url);
              console.log(`    GET succeeded for ${url}`);
            } catch (err2) {
              const error2 = err2 as AxiosError;
              console.log(`    GET failed for ${url} with status ${error2.response?.status}`);
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
